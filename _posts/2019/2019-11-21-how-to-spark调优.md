---
layout:     post
title:      "spark调优总结 "
subtitle:   "信息、载体、抽象、线程 设计乱谈"
date:       2019-11-21
author:     "LSG"
header-img: "img/post-bg-os-metro.jpg"
catalog: true
tags:
  - hadoop
  - spark
  - java
---

> 使用Spark的一些调优经验

## 一.Spark优化图解
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578893635262-b8e45c2d-d2cf-44cf-a27c-018478eeb978.png#align=left&display=inline&height=899&name=image.png&originHeight=899&originWidth=2410&size=237657&status=done&style=none&width=2410)

## 二.Spark
### 2.1代码把公共常用的配置项直接优先配置,之后具体实例可以覆盖配置

- 配置内容:
  - 序列化方式: KryoSerializer
  - 调度模式
  - spark.streaming.stopGracefullyOnShutdown
  - spark.reducer.maxSizeInFlight = 128m

```java
 /**
     * 所有任务公共配置
     *
     * @desc https://spark.apache.org/docs/latest/configuration.html
     */
    public static SparkConf getDefaultSparkConf() {
        return new SparkConf()
                .set("spark.scheduler.mode", "FIFO")
                .set("spark.shuffle.file.buffer", "1024k")
                .set("spark.reducer.maxSizeInFlight", "128m")
                .set("spark.shuffle.memoryFraction", "0.3")
                .set("spark.streaming.stopGracefullyOnShutdown", "true")
                .set("spark.streaming.kafka.maxRatePerPartition", "300")
                .set("spark.serializer", KryoSerializer.class.getCanonicalName())
                .registerKryoClasses(SERIALIZER_CLASS);
    }
```

### 2.2 子任务继承并得到sparkConf的配置

- 配置内容:
  - 允许动态分区
  - 


```java
 SparkConf sparkConf = SparkFactory.getDefaultSparkConf()
                //动态分区
                .set("hive.exec.dynamic.partition.mode", "nonstrict")
                .set("hive.exec.dynamic.partition", "true")
                .set("hive.exec.max.dynamic.partitions.pernode", "100000")
                .set("hive.exec.max.dynamic.partitions", "100000")
                .set("hive.exec.max.created.files", "100000")
                //缓解map端内存压力
                .set("spark.sql.shuffle.partitions", "100")
                //当内存剩余多少空间开始shuffle 向硬盘转移数据( reduce端聚合内存占比，默认0.2)
                .set("spark.shuffle.memoryFraction", "0.1")
                //解决map端产生大量文件,map写大量文件很慢,导致shuffle 很慢
                .set("spark.shuffle.consolidateFiles","true")

                .setAppName("Your app name");

         session = SparkSession.builder()
                .config(sparkConf)
                .enableHiveSupport()
                .getOrCreate();
//具体的业务执行
        handle();
```

### 2.3 shuffle调优

- 设置shuffle.partitions 数量    ->   一般对应一个spark sql 插入hive表后中hive 多出的小文件数量
- spark.shuffle.file.buffer                     map task的内存缓冲调节参数，默认是32kb    调优每次*2
- spark.shuffle.consolidateFiles 参数来合并文件，具体的使用方式为                     调优每次+0.1

#### 2.3.1 关于spark.shuffle.consolidateFiles参数
##### 问题：什么是shuffle？

> 答案：每个Spark作业启动运行的时候，首先Driver进程会将我们编写的Spark作业代码分拆为多个stage，每个stage执行一部分代码片段，并为每个stage创建一批Task，然后将这些Task分配到各个Executor进程中执行。一个stage的所有Task都执行完毕之后，在各个executor节点上会产生大量的文件，这些文件会通过IO写入磁盘（这些文件存放的时候这个stage计算得到的中间结果），然后Driver就会调度运行下一个stage。下一个stage的Task的输入数据就是上一个stage输出的中间结果。如此循环往复，直到程序执行完毕，最终得到我们想要的结果。Spark是根据shuffle类算子来进行stage的划分。如果我们的代码中执行了某个shuffle类算子（比如groupByKey、countByKey、reduceByKey、join等等）每当遇到这种类型的RDD算子的时候，划分出一个stage界限来。


> 每个shuffle的前半部分stage的每个task都会创建出后半部分stage对应的task数量的文件，（注意是前半部分的每个task都会创建相同数量的文件）。shuffle的后半部分stage的task拉取前半部分stage中task产生的文件（这里拉取的文件是：属于自己task计算的那部分文件）；然后每个task会有一个内存缓冲区，使用HashMap对值进行汇集；比如，task会对我们自己定义的聚合函数，如reduceByKey()算子，把所有的值进行累加，聚合出来得到最终的值，就完成了shuffle操作。

##### 当不配置该参数时:
shuffle中写磁盘操作是最消耗性能的,大量的小文件到下一个task,速度很慢
##### ![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578906963472-512548b9-bfed-4899-bda7-748f8882f415.png#align=left&display=inline&height=414&name=image.png&originHeight=414&originWidth=523&size=48690&status=done&style=none&width=523)


##### 为了解决产生大量文件的问题，我们可以在map端输出的位置，将文件进行合并操作:

![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578898258853-7ee1c8fa-7d24-4327-b309-2aef6de4149b.png#align=left&display=inline&height=471&name=image.png&originHeight=471&originWidth=713&size=94137&status=done&style=none&width=713)

**配置 spark.shuffle.consolidateFiles = true**
## Reference

- [Spark性能调优篇八之shuffle调优:重要](https://www.jianshu.com/p/069c37aad295)
- [Spark内核分析之Shuffle操作流程:非常重要](https://www.jianshu.com/p/f07b3654eeaa)
- [Spark性能调优篇六之调节数据本地化等待时长](https://www.jianshu.com/p/99ef69adc2b1)
