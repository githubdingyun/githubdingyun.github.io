---
layout: post
title:  "链接hive数据库的正确方式"
date:   2018-07-10 12:12:12
subtitle: 本文主要介绍了关于hive权限的配置文件,使用hive连接,使用hiveserver2后天启动,beeline和squi客户端链接hive
mathjax: true
author: "LSG"
header-img: "img/lxy004.jpg"
catalog: true
tags: 
  - hadoop 
  - hive 
  - nohup
---
> 自建集群hiveserver2需要后台启动,客户端操作hive比直接链接hive会更方便

*“hive:  数据仓库是olap分析中的一款利器”*

### 1.获得账号密码:   hive配置文件   hive-site.xml

```xml
<configuration>
	<property>
		<name>javax.jdo.option.ConnectionURL</name>
		<value>jdbc:mysql://140.143.67.105:3306/hive?createDatabaseIfNotExist=true&amp;useSSL=false</value>
		<description>JDBC connect string for a JDBC metastore</description>
	</property>

	<property>
		<name>javax.jdo.option.ConnectionDriverName</name>
		<value>com.mysql.cj.jdbc.Driver</value>
		<description>Driver class name for a JDBC metastore</description>
	</property>

	<property>
		<name>javax.jdo.option.ConnectionUserName</name>
		<value>账号</value>
		<description>username to use against metastore database</description>
	</property>

	<property>
		<name>javax.jdo.option.ConnectionPassword</name>
		<value>密码</value>
		<description>password to use against metastore database</description>
	</property>

        <property>
                <name>hive.server2.thrift.port</name>
                <value>server2的端口号 默认10000</value>
                <description>password to use against metastore database</description>
        </property>

</configuration>

```

### 2.使用hive链接

```shell
在bin目录下执行:
./hive
```

### 3.hiveserver2真正后台启动:

```
nohup ./hiveserver2 &
```

#### 3.1nohop简介:

nohup 是 no hang up 的缩写，就是不挂断的意思。

此前使用./hiveserver2 >> hive.log &  依旧命令会出现在控制台,导致hiveserver2卡死,并非真正后台启动

在参考了如下文章后,使用了nohop不挂断命令:   [Linux ——nohup和&的区别](https://blog.csdn.net/weixin_37490221/article/details/81539341)

要想进程不受shell中Ctrl C和Shell窗口关闭的影响，就将nohup和&指令一起使用

#### 3.2nohup命令：

如果你正在运行一个进程，而且你觉得在退出帐户时该进程还不会结束，那么可以使用nohup命令。该命令可以在你退出帐户/关闭终端之后继续运行相应的进程。

在缺省情况下该作业的所有输出都被重定向到一个名为nohup.out的文件中。

#### 3.3nohop案例

```shell
nohup command > myout.file 2>&1 &   
```

在上面的例子中，0 – stdin (standard input)，1 – stdout (standard output)，2 – stderr (standard error) ；

2>&1是将标准错误（2）重定向到标准输出（&1），标准输出（&1）再被重定向输入到myout.file文件中。

```shell
0 22 * * * /usr/bin/python /home/pu/download_pdf/download_dfcf_pdf_to_oss.py > /home/pu/download_pdf/download_dfcf_pdf_to_oss.log 2>&1
```

这是放在crontab中的定时任务，晚上22点时候怕这个任务，启动这个python的脚本，并把日志写在download_dfcf_pdf_to_oss.log文件中.

### 4.hive客户端的使用

客户端链接hievserver2的端口,可以多个客户端同时使用hive

命令行中:支持大数据hdfs操作如:

`dfs -ls /`

[hiveserver2:10002 图形化界面](http://hadoop02:10002/)可以查看hiveserver2是否链接

也可以使用:jps -m 查看是否开启

#### 4.1使用beeline

* 执行命令开启客户端



```sql
./beeline
!connect jdbc:hive2://localhost:30030
```

按照要求输入客户端登陆,成功连接hive

* 直接使用脚本

`2hiveserver2beeline.sh`脚本直接启动连接hive

```sql
beeline \
-u jdbc:hive2://hadoop03:10000 \
-n hdfs \
--autoCommit=false \
--color=true \
--autosave=true
```

每一个客户端相当于一个session,里面的参数设置,添加jar包都要执行,和其他客户端不冲突不关联

#### 4.2使用squirrel客户端

##### 4.2.1使用beeline很不方便,原因是:

* 不能记录以前的sql
* 写长sql很不方便
* 不能看以前执行的sql

那么可以使用有图形化界面的squirrel:  [squirrel 的连接方式:官网](https://cwiki.apache.org/confluence/display/Hive)

##### 4.2.2 主要操作是:

1. 导入hadoop对应版本的hive jar包:可以在hivelib下面找
2. 建立驱动和别名
3. 链接客户端
4. 放一张我链接成功的图QAQ:

![hdfs-img](/image/squirrel.png)

#### 4.3 使用idea客户端

1. 下载对应的jar  [hive-jdbc-3.1.1 - jar下载 - Maven Repository - IT猿网](https://maven.ityuan.com/maven2/org/apache/hive/hive-jdbc/3.1.1)
2. 使用代理,让对应的datagrip跑在代理中
3. 链接集群中的hiveserver2



## References

- [让进程在后台启动的方式](https://www.ibm.com/developerworks/cn/linux/l-cn-nohup/index.html)
- [beeline的使用](https://my.oschina.net/guol/blog/875875)
- [Hive _ Hive2 新版连接工具 beeline 详解](https://blog.csdn.net/u010003835/article/details/80675767)
- [jar驱动直接下载](https://maven.ityuan.com/maven2/org/apache/hive/hive-jdbc/3.1.1))