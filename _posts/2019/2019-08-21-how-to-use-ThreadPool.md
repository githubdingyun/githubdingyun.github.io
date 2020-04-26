---
layout:     post
title:      "如何正确的使用java线程池 "
subtitle:   "信息、载体、抽象、线程 设计乱谈"
date:       2019-08-21
author:     "LSG"
header-img: "img/post-bg-miui6.jpg"
catalog: true
tags:
  - Thread
  - Pool
  - java
---

### 1.为什么使用线程池:
- 复用已有资源
- 控制资源总量

### 2.java自带的四种线程池工厂
#### 2.1 Java通过Executors提供四种线程池，分别为：

1. newCachedThreadPool创建一个可缓存线程池，如果线程池长度超过处理需要，可灵活回收空闲线程，若无可回收，则新建线程。
1. newFixedThreadPool 创建一个定长线程池，可控制线程最大并发数，超出的线程会在队列中等待。
1. newScheduledThreadPool 创建一个定长线程池，支持定时及周期性任务执行。
1. newSingleThreadExecutor 创建一个单线程化的线程池，它只会用唯一的工作线程来执行任务，保证所有任务按照指定顺序(FIFO, LIFO, 优先级)执行。

#### 2.2使用线程池例子

```java
    public static void main(String[] args) {
        //建立一个特权线程工厂,这里是newCachedThreadPool,线程池中存活的最大值是无限大
        ExecutorService executorService = Executors.newCachedThreadPool(Executors.privilegedThreadFactory());
        //建立一个特权线程工厂,这里是newCachedThreadPool,线程池中存活的最大值是通过自己设定的
//        ExecutorService executorService = Executors.newFixedThreadPool(5, Executors.privilegedThreadFactory());
//        ExecutorService executorService = Executors.newSingleThreadExecutor();
//        ExecutorService executorService = Executors.newScheduledThreadPool(5, Executors.privilegedThreadFactory());
//        使用ScheduledExecutorService来代替timer
//        ((ScheduledExecutorService) executorService).scheduleWithFixedDelay(, , , )
        for (int i = 0; i < 10; i++) {
            executorService.execute(new Runnable() {
                public void run() {
                    System.out.println("你好");
                    try {
                        Thread.sleep(100);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
//                    while(true){
//                        try {
//                            Thread.sleep(100);
//                            System.out.println("hello");
//                        } catch (InterruptedException e) {
//                            e.printStackTrace();
//                        }
//
//                    }
                }
            });
            System.out.println(i);
        }

        try {
            // 向学生传达“问题解答完毕后请举手示意！”
            executorService.shutdown();

            // 向学生传达“XX分之内解答不完的问题全部带回去作为课后作业！”后老师等待学生答题
            // (所有的任务都结束的时候，返回TRUE)
            if (!executorService.awaitTermination(1, TimeUnit.MILLISECONDS)) {
                // 超时的时候向线程池中所有的线程发出中断(interrupted)。
                System.out.println("线程超时被打断");
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            // awaitTermination方法被中断的时候也中止线程池中全部的线程的执行。
            System.out.println("awaitTermination interrupted: " + e);
            executorService.shutdownNow();
        }

    }
```

### 3.开发规范不允许使用这四种工厂创建线程池
#### 3.1原因:
说明： Executors 返回的线程池对象的弊端如下：

- 1） FixedThreadPool 和 SingleThreadPool:
  - 允许的请求队列长度为 Integer.MAX_VALUE，可能会堆积大量的请求，从而导致 OOM。
- 2） CachedThreadPool 和 ScheduledThreadPool:
  - 允许的创建线程数量为 Integer.MAX_VALUE， 可能会创建大量的线程，从而导致 OOM。
#### 3.2 使用谁?
自己控制new ThreadPoolExecutor 并且设置参数

```java
    ThreadPoolExecutor executorService = new ThreadPoolExecutor(2, 200, 1, TimeUnit.MILLISECONDS, new ArrayBlockingQueue<>(1));
    for (int i = 0; i < 10; i++) {
            executorService.execute(runnable);
            executorService.execute(new Runnable() {
                public void run() {
                    System.out.println("你好");
                    try {
                        Thread.sleep(10000);
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
//                    while(true){
//                        try {
//                            Thread.sleep(100);
//                            System.out.println("hello");
//                        } catch (InterruptedException e) {
//                            e.printStackTrace();
//                        }
//
//                    }
                }
            });
            System.out.println(i);
        }
```

### 4.线程池考虑了什么问题?

#### 4.1 线程池架构图
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578909982785-8c875977-7287-48d4-bc04-c4a3d3eb0d20.png#align=left&display=inline&height=306&name=image.png&originHeight=306&originWidth=386&size=99026&status=done&style=none&width=386)
#### 4.2考虑的问题:

1. 任务队列:
  - 把任务放到队列里面，然后当线程空闲的时候，去队列里面取任务过来处理。
  - 这里选用了**BlockingQueue,**RabbitMQ、Kafka之类的消息中间件原理和此类似
2. 任务队列的类型:
  - **无界的阻塞队列**（Unbounded queues），比如**LinkedBlockingQueue**，来多少任务就放多少；
  - **有界的阻塞队列**（Bounded queues），比如**ArrayBlockingQueue**；
  - **同步移交**（Direct handoffs），比如**SynchronousQueue**，这个队列的put方法会阻塞，直到有线程准备从队列里面take，所以本质上SynchronousQueue并不是Queue，**它不存储任何东西，它只是在移交东西**
  - **如何设置:**把任务队列参数，放在构造函数里头，提供给使用线程池的人去设置。
3. 线程的数量:
  - **corePoolSize:**当线程池里的线程数少于corePoolSize时，每来一个任务，我就创建一条线程去处理   ,   线程数达到corePoolSize时，新来的任务，会先放到任务队列里面
  - **maximumPoolSize:**任务队列满了，但是线程池中的线程数还少于maximumPoolSize，那我就允许线程池继续创建线程
4. Keep-alive times:
  - **threadPoolExecutor.allowCoreThreadTimeOut(true)**:高峰期后,线程池中线程的数量超过corePoolSize，就会去监控线程，关闭多余的线程
  - **什么时候如何关闭:**线程从工作队列poll任务时，加上了超时限制，如果线程在keepAliveTime的时间内poll不到任务,就关闭线程
5. 拒绝策略:

如果线程池已经被shutdown了，或者线程池中使用的是有界队列，而这个队列已经满了，并且线程数已经达到最大线程数，无法再创建新的线程处理请求，这时候要怎么处理新来的任务？

  - **AbortPolicy**：使用这种策略的线程池，将在无法继续接受新任务时，给任务提交方抛出RejectedExecutionException，让他们决定要如何处理；
  - **CallerRunsPolicy**：这个策略，顾名思义，将把任务交给调用方所在的线程去执行；
  - **DiscardPolicy**：直接丢弃掉新来的任务；
  - **DiscardOldestPolicy**：丢弃最旧的一条任务，其实就是丢失blockingQueue.poll()返回的那条任务，要注意，如果你使用的是PriorityBlockingQueue优先级队列作为你的任务队列，那么这个策略将会丢弃优先级最高的任务，所以一般情况下，**PriorityBlockingQueue和DiscardOldestPolicy不会同时使用**

#### 4.3我们创建线程池时考虑什么

1. **corePoolSize  多大   -> 50**
1. **maximumPoolSize   -> 80**
1. 选用什么样的队列,队列多大: new ArrayBlockingQueue<>(100)
1. Keep-alive times:  10 second  
1. 拒绝策略

![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578921015573-25cce350-c1d3-4f3c-8a4f-d92505eb573d.png#align=left&display=inline&height=105&name=image.png&originHeight=209&originWidth=1873&size=77176&status=done&style=none&width=936.5)

### Reference

- [知乎:Java线程池是如何诞生的？](https://zhuanlan.zhihu.com/p/35188214)
- [Java 四种线程池](https://www.cnblogs.com/shihaiming/p/6703459.html)
- [如何学习Java多线程](https://zhuanlan.zhihu.com/p/35382932)
