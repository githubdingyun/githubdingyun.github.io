---
layout:     post
title:      "TCP的罪与罚"
subtitle:   "3次握手,4次分手,什么是多路复用,通信以什么行式存在"
date:       2018-02-01
author:     "LSG"
header-img: "img/tcp.png"
catalog: true
tags:
  - tcp
  - nio
  - network
  - Multiplexing
---

> TCP(Transmission Control Protocol)传输控制协议,网络编程中会话层编程将遵守传输层的协议,不用关心传输层一下的细节就能实现网络编程



## osi 网络7层协议
主要分为:应用层面和内核层面,主要为解耦,底层规范
### app:
**app{**

- 应用层			->TELNET，HTTP，FTP，NFS，SMTP    与其它计算机进行通讯的一个应用，它是对应应用程序的通信服务的。
- 展示层          ->                      这一层的主要功能是定义数据格式及加密
- 会话层			->RPC，SQL等。          如何开始、控制和结束一个会话，包括对多个双向消息的控制和管理，

**}**
### kernel:
**kernel{**

- 传输层     ->是否选择差错恢复协议还是无差错恢复协议，及在同一主机上对不同应用的数据流的输入进行复用，还包括对收到的顺序不对的数据包的重新排序功能。  TCP，UDP，SPX。
- 网络层		->对端到端的包传输进行定义，定义了路由实现的方式和学习的方式。定义了如何将一个包分解成更小的包的分段方法   IP，IPX等。
- 数据链路层	->它定义了在单个链路上如何传输数据。  ATM，FDDI等	
- 物理层		->连接头、帧、帧的使用、电流、编码及光调制等都属于各种物理层规范中的内容。物理层常用多个规范完成对所有细节的定义。 Rj45，802.3等。

**}**

![image](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTHR9QJP_KemFQ6lcdCaUcuPwnmVGLvNgR3YWXvRX5fzTiB-RIGtw&s)

## 3次握手和4次分手
### 3次握手详解,为什么需要三次?
TCP是主机对主机层的传输控制协议，提供可靠的连接服务，采用三次握手确认建立一个连接：

**位码**即tcp标志位，有6种标示：

- SYN(synchronous建立联机)
- ACK(acknowledgement 确认)
- PSH(push传送)
- FIN(finish结束)
- RST(reset重置)
- URG(urgent紧急)

**关键名词**

- Sequence number(顺序号码)
- Acknowledge number(确认号码)

第一次握手：主机A发送位码为syn＝1，随机产生seq number=1234567的数据包到服务器，主机B由SYN=1知道，A要求建立联机；

第二次握手：主机B收到请求后要确认联机信息，向A发送ack number=(主机A的seq+1)，syn=1，ack=1，随机产生seq=7654321的包；

第三次握手：主机A收到后检查ack number是否正确，即第一次发送的seq number+1，以及位码ack是否为1，若正确，主机A会再发送ack number=(主机B的seq+1)，ack=1，主机B收到后确认seq值与ack=1则连接建立成功。对应socket或其它应用进入Established阶段
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1577962014018-175d3876-453d-4ead-843c-9f264e428cdf.png#align=left&display=inline&height=451&name=image.png&originHeight=451&originWidth=525&size=90401&status=done&style=none&width=525)

#### 3次的原因:
因为网络链接非物理连接,需要双方确认能互相正确应答,三次握手最少的确认了链接可靠性

### 什么是SYN包 以及SYN攻击原理

[https://blog.csdn.net/zzz_781111/article/details/4183743](https://blog.csdn.net/zzz_781111/article/details/4183743)

### 4次分手详解,为什么需要四次?

建立一个连接需要三次握手，而终止一个连接要经过四次握手，这是由TCP的半关闭（half-close）造成的。具体过程如下图所示。
（1） 某个应用进程首先调用close，称该端执行“主动关闭”（active close）。该端的TCP于是发送一个FIN分节，表示数据发送完毕。
（2） 接收到这个FIN的对端执行 “被动关闭”（passive close），这个FIN由TCP确认。
注意：当TCP链接中A向B发送 FIN 请求关闭，另一端B回应ACK之后，并没有立即发送 FIN 给A,A方处于半连接状态（半开关），此时A可以接收B发送的数据，但是A已经不能再向B发送数据。
（3） 一段时间后，接收到这个文件结束符的应用进程将调用close关闭它的套接字。这导致它的TCP也发送一个FIN。
（4） 接收这个最终FIN的原发送端TCP（即执行主动关闭的那一端）确认这个FIN。 [3]
既然每个方向都需要一个FIN和一个ACK，因此通常需要4个分节。
注意：
（1） “通常”是指，某些情况下，步骤1的FIN随数据一起发送，另外，步骤2和步骤3发送的分节都出自执行被动关闭那一端，有可能被合并成一个分节。
（2） 在步骤2与步骤3之间，从执行被动关闭一端到执行主动关闭一端流动数据是可能的，这称为“半关闭”（half-close）。
（3） 当一个Unix进程无论自愿地（调用exit或从main函数返回）还是非自愿地（收到一个终止本进程的信号）终止时，所有打开的描述符都被关闭，这也导致仍然打开的任何TCP连接上也发出一个FIN。
无论是客户还是服务器，任何一端都可以执行主动关闭。通常情况是，客户执行主动关闭，但是某些协议，例如，HTTP/1.0却由服务器执行主动关闭。
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1577962118990-f60ee3d4-7e2f-42b5-a417-dad5cc09d595.png#align=left&display=inline&height=398&name=image.png&originHeight=398&originWidth=424&size=86701&status=done&style=none&width=424)
#### 4次的原因
所以总的来说,非通常情况下,可以3次分手,但是如果**由于半关闭的原因,将必不可少的必要的4次分手**

## linux的io多路复用
### 图解:
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1577964275663-5497c6aa-af97-4cfa-9878-965aa2616352.png#align=left&display=inline&height=122&name=image.png&originHeight=122&originWidth=326&size=11403&status=done&style=none&width=326)OR![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1577964306189-3a966516-70be-4414-805a-833a3a1e2b8f.png#align=left&display=inline&height=118&name=image.png&originHeight=133&originWidth=444&size=35303&status=done&style=none&width=394)
**I/O multiplexing 这里面的 multiplexing 指的其实是在单个线程通过记录跟踪每一个Sock(I/O流)的状态(对应空管塔里面的Fight progress strip槽)来同时管理多个I/O流**.
### socket
每一个网络通信的进程至少对应着一个Socket。向Socket的ID中写数据，相当于向网络发送数据，向Socket中读数据，相当于从网络中接收数据。而且这些套接字都有唯一标识符——端口号port。
### 应用间通信图解:
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1577963785703-64dc438e-a898-4fab-88f2-5f8e04dd1b14.png#align=left&display=inline&height=455&name=image.png&originHeight=455&originWidth=699&size=217469&status=done&style=none&width=699)
### TCP通信:
 TCP套接字是由一个四元组**（源IP地址、源端口号，目的IP地址，目的端口号）**来标识的。这样，当一个TCP报文段从网络到达一台主机时，主机会使用全部4个值来将报文段定向，即多路分解到相应的套接字。
多路复用就是从源主机的不同套接字中收集数据块，并为每个数据块封装上首部信息从而生成报文段，然后将报文段传递到网络层中去。
多路复用的要求：1、套接字有唯一标识符。2、每个报文段有特殊字段（源端口号字段和目的端口号字段）来指示该报文段所要交付到的套接字。
### UDP通信
     在使用UDP来传输报文段时，一个UDP套接字是由一个含有目的IP地址和目的端口号的二元组来全面标识的。因此，如果两个UDP报文段有不同的源IP地址和源端口，但具有相同的IP地址和目的端口号，那么这两个报文段将通过相同的目的端口号定向到相同的目的进程。
### select/poll/epoll
epoll基于事件驱动，epoll_ctl注册事件并注册callback回调函数，epoll_wait只返回发生的事件避免了像select和poll对事件的整个轮寻操作。
## 从应用层到传输层依次往下的实现
用 server ip+port 和 client ip+port 定位一个tcp链接
首先 server socket 打开一个listen,监听要来的链接
来一个client要求建立连接,linux为它开辟一个文件用来存 ip+port的文件缓冲区,形成ESTABLISHED链接

#### 查看所在hadoop集群机器上tcp情况
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1577963197369-d9364a6d-8408-405b-967f-f6ab58315308.png#align=left&display=inline&height=709&name=image.png&originHeight=709&originWidth=1056&size=555618&status=done&style=none&width=1056)
#### 查看所在hadoop集群机器上所开的本地监听server

#### ![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1577963204321-7ef57b2c-bd6f-4689-92b8-4be586e0bd52.png#align=left&display=inline&height=754&name=image.png&originHeight=754&originWidth=1209&size=597121&status=done&style=none&width=1209)



**netty中的 boss和worker   ---对应--->   LISTEN 和 ESTABLISHED**

## reference

- [关于TCP协议的总结](https://www.jianshu.com/p/e916bfb27daa)
- [计算机网络运输层之多路复用与多路分解](https://blog.csdn.net/ziyonghong/article/details/87896546)
- [知乎: IO 多路复用是什么意思？](https://www.zhihu.com/question/32163005)
- [nio轮询方式与epoll](BIO\NIO\AIO再理解，nio轮询方式与epoll)
- [Understanding the TCP/IP protocol suite](https://blog.serverdensity.com/tcpip-three-way-handshake-traceroute/)
