---
layout: post
title:  "常见java web开发是如何使用多线程和解决数据冲入问题的"
date:   2019-08-01
mathjax: true
author: "LSG"
header-img: "img/post-bg-web.jpg"
catalog: true
tags: 
  - java
  - Thread 
  - mysql
  - nio
  - cap
---



> 

# > java如何配合Mysql做到多线程+高并发下的数据不重入

> 在传统的web开发中: java如何配合Mysql做到多线程+高并发下的数据不重入

## 前言

"常见的javaEE中,例如SSM架构或者SpringBoot项目中我们对多线程和数据重入的感知是很小的,本篇文章将对多线程中的线程之间的协程合作(锁或通信),锁到达了什么粒度,避免数据重入的方式,怎样正确的使用框架解决问题进行阐述"

### mysql+tomcat多线程(事务模型)解决了的数据重入问题
现在常见的javaEE开发一般是使用 tomcat+(框架)+ mysql 来完成多线程之间数据不重入问题的,tomcat解决了多线程模型,并封装好nio,而mysql作为存储数据的工具,则解决了多线程模型下数据安全的问题.


多线程+数据存储     -----框架---->        tomcat多线程+mysql多事务处理数据 

使用这两个框架组合,并合理使用事务和update锁能够使(当这两个组件运行正常时),达到金融级软件的操作,并能够更合理充分的使用服务器资源(合理且小的锁粒度和数据结构)

### 存储在MySQL中的数据重入问题

我们先要知道mysql默认事务不会出现和会出现的问题

#### mysql inodb 默认事务隔离条件
默认情况下mysql 事务的隔离级别是可重复读,在多线程操作下不会出现脏读,第一类丢失更新,第二类丢失更新的问题
但是会出现幻读的问题

- 第一类丢失更新：

在没有事务隔离的情况下，两个事务A B 都对同一 数据S 做修改， A修改S成功后，B修改失败发生回滚，回滚的S导致A的修改被覆盖成原先的数据。导致两次对S的修改都失败。
READ COMMITTED以及以上的隔离机制都能解决。

- 脏读

事务A B处理同一条数据S，在事务A修改了S这条数据但是还未提交数据时，事务B读取了事务A修改后的数据S，然后事务A回滚了，导致事务B读取的该条数据S是不存在的。因为S是之前的内容
REPEATABLE READ隔离机制就能解决  

- 不可重复读

还是事务A B处理同一条数据S，事务A读取了数据S，然后事务B修改了数据S，然后事务A又读取了数据S，此时事务A读取的两次S的数据是事务B修改前后的数据，显然不同
REPEATABLE READ隔离机制就能解决 

- 第二类丢失不可重复读的特例

事务A B处理同一条数据S，事务A把S修改成了S1，事务B后来又把S修改成了S2，然而事务B修改的S2没有在S1的基础上，导致事务A的修改没有作用了，也就是失败了。  

- 幻读  

幻读，并不是说两次读取获取的结果集不同，幻读侧重的方面是某一次的 select 操作得到的结果所表征的数据状态无法支撑后续的业务操作。更为具体一些：select 某记录是否存在，不存在，准备插入此记录，但执行 insert 时发现此记录已存在，无法插入，此时就发生了幻读。不同于不可重复读。 

#### 数据重入的避免
由于我们的业务数据并不存储在java内存中,而是通过 mysql driver直接调用mysql,所以多线程问题变成了多事务访问mysql数据的问题,只要解决了mysql多事务下的数据锁的正确使用,就解决了数据的不可预期性变化.

我们的一些简单业务一般设置为普通事务,他们同时也是默认的事务自动提交,如果这些业务不会发生幻读,直接使用即可.

** 另一种不允许幻读出现情况的解决方式: **
![image.png](https://cdn.nlark.com/yuque/0/2019/png/152121/1576670907652-34f74233-afdb-42e2-9954-2a8b40b947c1.png#align=left&display=inline&height=723&name=image.png&originHeight=723&originWidth=1163&size=72853&status=done&style=none&width=1163)


### 存储在JAVA中的数据重入问题
#### 被重入的是全局变量
    当一些全局数据要被多线程操作的时候,就会出现数据重入,导致结果没有向预期结果发生 

    对于这些数据,优先使用原子类或线程安全的集合类(他们的粒度小,并且使用乐观锁)

#### 被重入的是一段业务操作
    当需要的锁的条件比较复杂时,使用串行锁关键字(注意保证业务情况下粒度尽可能小)或外部数据结构解决(redis+锁 / mysql + 锁)避免数据重入


#### java解决数据重入的方式 图解:



![存储在jvm的数据重入问题.png](https://cdn.nlark.com/yuque/0/2019/png/152121/1576724747047-c6397a1b-466b-48a7-8992-ae1343014e84.png#align=left&display=inline&height=1758&name=%E5%AD%98%E5%82%A8%E5%9C%A8jvm%E7%9A%84%E6%95%B0%E6%8D%AE%E9%87%8D%E5%85%A5%E9%97%AE%E9%A2%98.png&originHeight=1758&originWidth=1639&size=260911&status=done&style=none&width=1639)

### 思考:多线程/进程解决了什么问题,出现了什么问题?
#### 解决了:

- 更充分使用服务器资源:  包括 磁盘io,网络io,内存,cpu etc

![image.png](https://cdn.nlark.com/yuque/0/2019/png/152121/1576726215693-54abf736-9ab6-44bb-8ff7-ea3fd6118a49.png#align=left&display=inline&height=862&name=image.png&originHeight=862&originWidth=546&size=347789&status=done&style=none&width=546)

- 用户体验

听歌+编程+写blog+挣钱 同时进行

- 大量异步结构 :  什么东西不卡这,放后台执行,回调函数来

类似mq,异步servlet, 我不苦等结果返回,而是把要处理的数据放到队列或其它数据结构中,单开出线程或消费者去跑数据,消耗cpu

- fork/join map/reduce 模型的出现

多线程或分布式进程通过通信去合作完成 跑数据操作,大家汇集自己的工作成果然后得到全局的工作成果

#### 缺点:

- 管理复杂性(数据重入问题)
- 分布式情况下的cap 问题:
  1. 强一致性（Consistency）
  1. 可用性（Availability）
  1. 分区容错性（Partition tolerance
1. CA　　-单点集群，满足一致性，可用性的系统，通常在可扩展性上不太强大。

　　注：传统Oracle数据库

2. CP　　-满足一致性、分区容错性的系统，通常性能不是特别高。

　　注：大多数网站架构的选择

3. AP　　-满足可用性、分区容错性的系统，通常可能对一致性要求低一些。

　　注：redis、mongodb

- 更高效,更小粒度的框架
  1. nio/aio for 异步io
  1. 乐观锁
- 编程过程中不可预期的错误
  1. 死锁问题
  1. 数据重入
  1. 框架上手难度高


## References

- [知乎 : 多线程解决了什么问题](https://www.zhihu.com/question/19901763)

- [csdn : 分布式数据库下的cap问题](https://www.cnblogs.com/it-taosir/p/9892801.html)

- [一文搞懂Raft算法](https://www.cnblogs.com/xybaby/p/10124083.html)



