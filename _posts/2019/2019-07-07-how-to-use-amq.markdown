---
layout:     post
title:      "activemq同步发送和异步发送"
subtitle:   "使用amq来消费日志并过滤并发送邮件,每日数据大概8000万"
date:       2019-07-07
author:     "LSG"
header-img: "img/lxy003.jpg"
catalog: true
tags:
  - MQ
  - java
  - ActiveMQ
---

## 前言
​	具体场景是工作中机器上所有项目服务日志并不落地自己所在机器,而是发送到一台机器的amq上,通过重写log4j源代码,重新解析log4j.propertites文件把所有项目日志分目录,层次的打到各个文件目录下,并把异常日志通过项目配置人的方式发送到每个人的邮件和企业微信上.



-------------------------------------------------------

"ActiveMQ -> 生产者和消费者保证消息可靠性的常见使用"

## 使用消息队列的优缺点分析
### 消息队列共有的优点:

* 解耦: 传统模式系统间耦合性太强, 而mq将消息写入消息队列，需要消息的系统自己从消息队列中订阅，从而系统A不需要做任何修改。
* 异步: 将消息写入消息队列，非必要的业务逻辑以异步的方式运行，加快响应速度 (比如写日志,发邮件,处理逻辑)
* 削峰: 传统模式并发量大的时候，所有的请求直接怼到数据库，造成数据库连接异常  ,  而消息队列可以慢慢拉取消息。在生产中，这个短暂的高峰期积压是允许的
* 可靠: 好的消息队列设置是可以保证可靠的

### 消息队列共有的缺点:
* 系统可用性降低: 消息队列不能坏
* 复杂性增加: 一致性,可靠性

## 基本设置:
    队列:
    同步队列:
    多次消费:
    如何保证有序性:
    数据持久化:
    属性结构:
       connfactory->conn->session->producer/consumer
    数据结构:
        1. topic
        2. queue
    配置结构:
        异步:
        持久化: 生产者需要的关键字:  DeliveryMode.PERSISTENT   ->当
        确认字:AUTO_ACKNOWLEDGE/CLIENT_ACKNOWLEDGE/DUPS_OK_ACKNOWLEDGE/SESSION_TRANSACTED ->当消息确认后队列才会把消息移出
        消费者一次拉的数据量:consumer.prefetchSize=50
        开启事务:
    和jms规范进行对接:


## 生产者:
### 同步发送:
* 性能: 低   效率  : <100条/s

不设置异步同时持久化的情况下，send 方法都是同步的，并且一直阻塞直到ActiveMQ 
发回确认消息：消息已经存储在持久性数据存储中,接受到 broker 的确认消息之前应用程序或线程会被阻塞。 PERSISTENT  (异步也能保证持久性)

###同步发送代码示例:

```java
connection.createSession(Boolean.TRUE, Session.AUTO_ACKNOWLEDGE);
Destination destination = session.createQueue("Test-Queue");
MessageProducer messageProducer = session.createProducer(destination);
messageProducer.setDeliveryMode(DeliveryMode.PERSISTENT);
messageProducer.send(text);
```

### 开启事务情况下的同步发送:
  * 性能: 中   效率  :  4000条左右/s 
开启事务要注意一个问题，一个事务中每次提交的消息不宜太大，不然会导致内存溢出，mq宕机。
** 注意：一个事务提交建议500条，最大1000条！！！提交的消息< 2M！！！ ** 
### 同步发送+事务代码示例:

```java
try {
            ConnectionFactory connectionFactory = new ActiveMQConnectionFactory(
            ActiveMQConnectionFactory.DEFAULT_USER,
            ActiveMQConnectionFactory.DEFAULT_PASSWORD,  
            "failover:(tcp://111.111.16.51:61616,tcp://111.143.56.51:61617,tcp://111.143.56.51:61618)");
            //放到线上要用内网IP
            Connection connection = connectionFactory.createConnection();
            connection.start();
            //Boolean.TRUE 表示开启事务
            Session session = 
            connection.createSession(Boolean.TRUE, Session.AUTO_ACKNOWLEDGE);
            Destination destination = session.createQueue("Test-Queue");
            MessageProducer producer = session.createProducer(destination);
            producer.setDeliveryMode(DeliveryMode.PERSISTENT);
            for(int i = 1 ; i <= 250000 ; i ++){
                TextMessage msg = session.createTextMessage("我是*消息内容*" + i);
                producer.send(msg);
            }
            session.commit();
            if(connection != null){
                connection.close();
            }
        } catch (Exception e) {
             try {
             session.rollback();
            } catch (JMSException e1) {
                // todo rollback失败
            }
            e.printStackTrace();
        }
    }
}
```
### 异步发送+回调:
   * 性能: 高   
   * 效率：>1W条/s  (注意：一条消息<2M)
#### 设置使用异步发送的三种方式:

```java
        //ConnectionFactory中指定
        cf = new ActiveMQConnectionFactory("tcp://locahost:61616?jms.useAsyncSend=true");
        ((ActiveMQConnectionFactory)connectionFactory).setUseAsyncSend(true);
        //ActiveMQConnection中设置
        ((ActiveMQConnection)connection).setUseAsyncSend(true)
```

#### 异步发送(官方实例):
```java
    private double benchmarkCallbackRate() throws JMSException, InterruptedException {
        Session session = connection.createSession(false, Session.AUTO_ACKNOWLEDGE);
        Queue queue = session.createQueue(getName());
        int count = 1000;
        final CountDownLatch messagesSent = new CountDownLatch(count);
        ActiveMQMessageProducer producer = (ActiveMQMessageProducer) session.createProducer(queue);
        producer.setDeliveryMode(DeliveryMode.PERSISTENT);
        long start = System.currentTimeMillis();
        for (int i = 0; i < count; i++) {
            producer.send(session.createTextMessage("Hello"), new AsyncCallback() {
                @Override
                public void onSuccess() {
                    messagesSent.countDown();
                }

                @Override
                public void onException(JMSException exception) {
                    exception.printStackTrace();
                }
            });
        }
        messagesSent.await();
        return 1000.0 * count / (System.currentTimeMillis() - start);
    }
```
同步发送和异步发送的区别就在此，同步发送等send不阻塞了就表示一定发送成功了，可是异步发送需要接收回执并由客户端再判断一次是否发送成功。


#### 异步发送的一般写法(因为一般我们的生产者会复用:):

```java
public void sendMessage(ActiveMQMessage msg, final String msgid) throws JMSException {
     producer.send(msg, new AsyncCallback() {
          @Override
          public void onSuccess() {
              // 使用msgid标识来进行消息发送成功的处理
              System.out.println(msgid+" has been successfully sent.");
          }
          @Override
          public void onException(JMSException exception) {
              // 使用msgid表示进行消息发送失败的处理
              System.out.println(msgid+" fail to send to mq.");
              exception.printStackTrace();
          }
      });
}
```
> 异步发送丢失消息的场景是：生产者设置UseAsyncSend=true，使用producer.send(msg)持续发送消息。由于消息不阻塞，
>
> 生产者会认为所有send的消息均被成功发送至MQ。如果服务端突然宕机，此时生产者端内存中尚未被发送至MQ的消息都会丢失。

异步发送需要接收回执并由客户端再判断一次是否发送成功,一般通过回执消息来保证消息的可靠性.



源码解读: 发送的线程通过回调函数告诉主线程是否发送成功,主线程根据收到的消息进行不同情形下的数据处理



## 消费者:
### 同步阻塞接受:
* 性能: 慢    

但是维护容易,消息不易丢失,同时采用CLIENT_ACKNOWLEDGE来保证消息完好消费
#### 代码示例:

    Session session = aliyunAmqConnection.createSession(false, Session.AUTO_ACKNOWLEDGE);
    Queue workQueue = session.createQueue(queueName+"?consumer.prefetchSize=50");
    MessageConsumer consumer = session.createConsumer(workQueue);
        while(true){
            // 停止信号
            if(stopFlag == 1){
                break;
            }
            message = consumer.receiveNoWait();
            if (message == null) {
                    //MQ中没有消息的时候,调用会直接返回,返回值为NULL,不能频繁一直调用,所以要睡眠1秒
                    SystemUtils.sleep(1);
                    continue;
                }
            handle(message);
        }
    

### 异步接收:
1. 自动确认接受
2. 手动确认接受

* 性能: 快

#### 代码示例:
```java
public class LogConsumerWithAMQ implements MessageListener {

    private AmqConfig producerAmqConfig = null;

    public LogConsumerWithAMQ() throws Exception {
        producerAmqConfig = SystemUtils.getAmqProducer(SystemUtils.getEmailQueueName());
    }

    @Override
    public void onMessage(Message message) {
        String log = null;
        try {
            log = LogWriteUtils.transMessageType(message);
            this.handle(log);
            //手动调用确保消费成功后再从队列中移除message   ->     当Session session = aliyunAmqConnection.createSession(false, Session.CLIENT_ACKNOWLEDGE); 第一个参数表示开启事务,第二个表示确认收到的方式
            //            message.acknowledge();
        } catch (Exception e) {
            LogWriteUtils.error("[Log Consumer With AMQ ] 一条日志信息记录异常..." + log, e);
        }
    } 

    // 调用
        @Test
    public void pro1() {
        amqConfig.getConsumer().setMessageListener(new LogConsumerWithAMQ());
    }


}
```

## 全局保证消息的可靠性的方法:
1. 生产者保证发送到消息队列中: 同步+持久化/异步+回调函数(日志/邮件感知)   对于生产者来讲, AUTO_ACKNOWLEDGE 即可
2. 消费者同步消费,消息消费成功手动 msg.acknowledge() /消费者异步消费,消费成功再  msg.acknowledge()

## References
1. [消息队列对比传统模式的优点](https://blog.csdn.net/wonderful_life_mrchi/article/details/84667426)
2. [ActiveMQ异步发送使用及常见误区](https://www.jianshu.com/p/58e9deae6c4b)
3. [activemq发送同步发送和异步发送](https://blog.csdn.net/YAOQINGGG/article/details/79833378)
4. [jms的消息确认和事务](https://segmentfault.com/a/1190000015920000)