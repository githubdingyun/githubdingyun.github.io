---
layout:     post
title:      "一台自用linux的最初配置"
subtitle:   "可以配置虚拟机上的linux,如果自己主力机是linux也能使用这些好工具"
date:       2018-05-25
author:     "LSG"
header-img: "img/post-bg-2015.jpg"
catalog: true
tags:
	-java
	-NIO
---

 “对语言设计人员来说，创建好的输入／输出系统是一项特别困难的任务。”



――《Think in Java》



# 历史背景：

>    无论是系统、还是语言的设计中IO的设计都是异常复杂的。面临的最大的挑战一般是如何覆盖所有可能的因素，我们不仅仅要考虑文件、控制台、网络、内存等不同的种类，而且要处理大量的不同的读取方式，如：顺序读取、随机读取，二进制读取、字符读取，按行读取、按字符读取……

> ​    Linux是第一个将设备抽象为文件的操作系统，在Linux中所有的外部设备都可以用读取文件的方法读取，这样编程人员就可以以操作文件的方法操作任何设备。C++在IO方面也做了一些改进――引进了流的概念，我们可以通过cin、cout读写一些对象。Java语言在IO设计方面取得较大的成功，它是完全面向对象的，主要采用装饰器模式避免大量的类，包括了最大的可能性，提供了较好的扩展机制……
>
> 
>
> ​    “Java库的设计者通过创建大量类来攻克这个难题。事实上，Java的IO系统采用了如此多的类，以致刚开始会产生不知从何处入手的感觉（具有讽刺意味的是，Java的IO设计初衷实际要求避免过多的类）。” 上面一段来自《Think in Java》，确实很多初学者刚刚学习java的IO时会比较茫然，不过等我们知道装饰器模式（Decorator）的用意、场景及其在Java的IO包中的使用，你可能会真正领会整个IO的FrameWork。

> I/O 问题是任何编程语言都无法回避的问题，可以说 I/O 问题是整个人机交互的核心问题，因为 I/O 是机器获取和交换信息的主要渠道。在当今这个数据大爆炸时代，I/O 问题尤其突出，很容易成为一个性能瓶颈。正因如此，所以 Java 在 I/O 上也一直在做持续的优化，如从 1.4 开始引入了 NIO，提升了 I/O 的性能。

# IO的分类：

## java.io包中堵塞型IO：![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1533209227847-8d08091a-1952-454f-8e4c-da8803384666.png?x-oss-process=image/resize,w_1500)

QAQ点击查看大图

### javaIO的分类：

- 流式IO：

- 非流式IO：

- 文件读取相关的类：

### 按照分类的具体介绍：

>  流式部分可以概括为：两个对应一个桥梁。两个对应指：
>
> 1.字节流（Byte Stream）和字符流（Char Stream）的对应；
>
> 2.输入和输出的对应。一个桥梁指：从字节流到字符流的桥梁。对应于输入和输出为InputStreamReader和                  OutputStreamWriter。
>
> 
>
>  在流的具体类中又可以具体分为：
>
> 1.介质流（Media Stream或者称为原始流Raw Stream）――主要指一些基本的流，他们主要是从具体的介质上，如：文件、内存缓冲区（Byte数组、Char数组、StringBuffer对象）等，读取数据；
>
> 2.过滤流（Filter Stream）――主要指所有FilterInputStream/FilterOutputStream和FilterReader/FilterWriter的子类，主要是对其包装的类进行某些特定的处理，如：缓存等。

### 流式IO结构简图:



![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1533211431302-ce0bf6e7-62b7-441a-b2fd-0c0f935e3071.png)

### 非流式IO结构简图：

- File

- RandomAccessFile

- FileDescriptor

#### RandomAccessFile

   可能有些场合我们需要在文件中随机插入数据、在流中来来回回地执行某些操作，这时候我们绝对不可以使用流相关的对象。很幸运JDK的设计者为我们设计了一个单独的类RandomAccessFile，它可以完成打开、关闭文件、以基本数据类型的方式读取数据、读取下一个行、以UTF等格式读取数据、写入各种类型的数据、比较特殊的是他可以通过文件指针的seek方法让文件指针移到某个位置，可以通过getFilePointer方法得到当前指针的位置、可以通过length（）方法得到当前文件的容量、通过getFD得到FileDescriptor对象，通过getChannel方法得到FileChannel对象，从而和New IO整合。

### 文件读取相关的类：

- SerializablePermission

- FileSystem

- Win32FileSystem

- WinNTFileSystem









## java.nio包中的非堵塞型IO:![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1533209578753-db11b31d-d945-47de-97be-aeb8a55dc028.png?x-oss-process=image/resize,w_1500)

点击查看大图QAQ



### nio的好处：

> 学过操作系统的朋友都知道系统运行的瓶颈一般在于IO操作，一般打开某个IO通道需要大量的时间，同时端口中不一定就有足够的数据，这样read方法就一直等待读取此端口的内容，从而浪费大量的系统资源。有人也许会提出使用java的多线程技术啊！但是在当前进程中创建线程也是要花费一定的时间和系统资源的，因此不一定可取。Java New IO的非堵塞技术主要采用了Observer模式，就是有一个具体的观察者和＝监测IO端口，如果有数据进入就会立即通知相应的应用程序。这样我们就避免建立多个线程，同时也避免了read等待的时间。

## 文件读取相关的类：

--- 待更新

