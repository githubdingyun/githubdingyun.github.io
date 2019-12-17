---
layout:     post
title:      "使用sqoop进行数据迁移,备份 "
subtitle:   "从数据库到数据仓库,从数据全量增量到数据增量"
date:       2019-06-24
author:     "LSG"
header-img: "img/sqoop000.jpg"
catalog: true
tags:
  - hadoop
  - hive
  - sqoop
  - mysql
  - tidb
---

## 前言
这里这介绍sqoop1,x版本,如果是高版本可以自己查阅学习,但基本操作和功能不会变化太多

## 安装
### 添加mysql的驱动
ambari中的jar包位置 : `/usr/hdp/current/sqoop-client/lib`

添加到lib中: `cp mysql-connector-java-5.1.47 /usr/hdp/current/sqoop-client/lib`

### 验证是否安装成功
* sqoop-version

![img](../../img/in-post/sqoop-verson.jpg)

* sqoop help


## DML操作
* how dataabses;

```sh
 sqoop list-databases \
 --connect jdbc:mysql://172.21.16.3:3307/ \
 --username root \
 --password Agb8PYIoPC2mxDJS
```

* show tables:

```sh
sqoop list-tables \
 --connect jdbc:mysql://172.21.16.3:3307/hive_data_warehouse \
 --username root \
 --password Agb8PYIoPC2mxDJS
```

* 克隆表结构

创建一张跟mysql中的help_keyword表一样的hive表hk
```sh
sqoop create-hive-table \
--connect jdbc:mysql://hadoop1:3306/mysql \
--username root \
--password root \
--table user_detail \
--hive-table hive_user_detail
```


## 增量和全量:
### 全量
全量，这个很好理解。就是每天定时（避开业务高峰期）或者周期性全量把数据从一个地方拷贝到另外一个地方；

```sh
# 全量数据导入
sqoop import \
 --connect jdbc:mysql://192.168.xxx.xxx:3316/testdb \
 --username root \
 --password 123456 \
 --query “select * from test_table where \$CONDITIONS” \
 --target-dir /user/root/person_all \ 
 --fields-terminated-by “,” \
 --hive-drop-import-delims \
 --null-string “\\N” \
 --null-non-string “\\N” \
 --split-by id \
 -m 6 \
```


* 参数含义表

| **参数**                      | **说明**                                                         |
| ------------------------- | ------------------------------------------------------------ |
| –incremental append       | 基于递增列的增量导入（将递增列值大于阈值的所有数据增量导入Hadoop） |
| –check-column             | 递增列（int）                                                |
| –last-value               | 阈值（int）                                                  |


### 增量:
增量的基础是全量，就是你要使用某种方式先把全量数据拷贝过来，然后再采用增量方式同步更新。

增量的话，就是指抓取某个时刻（更新时间）或者检查点（checkpoint）以后的数据来同步，不是无规律的全量同步。

#### sqoop的增量两种方式
* 1、Append方式

```sh
# Append方式的全量数据导入
 sqoop import \
   --connect jdbc:mysql://192.168.xxx.xxx:3316/testdb \
   --username root \
   --password 123456 \
   --query “select order_id, name from order_table where \$CONDITIONS” \
   --target-dir /user/root/orders_all \ 
   --split-by order_id \
   -m 6  \
   --incremental append \
   --check-column order_id \
   --last-value 5201314
```


* 参数含义表


| **参数**                      | **说明**                                                         |
| ------------------------- | ------------------------------------------------------------ |
| – query                   | SQL查询语句                                                  |
| – target-dir              | HDFS目标目录（确保目录不存在，否则会报错，因为Sqoop在导入数据至HDFS时会自己在HDFS上创建目录） |
| –hive-drop-import- delims | 删除数据中包含的Hive默认分隔符（^A, ^B, \n）                 |
| –null-string              | string类型空值的替换符（Hive中Null用\n表示）                 |
| –null-non-string          | 非string类型空值的替换符                                     |
| –split-by                 | 数据切片字段（int类型，m>1时必须指定）                       |
| -m                        | Mapper任务数，默认为4                                        |

* 2、lastModify方式

```sh
# 将时间列大于等于阈值的数据增量导入HDFS
 sqoop import \
   --connect jdbc:mysql://192.168.xxx.xxx:3316/testdb \
   --username root \
   --password transwarp \
   --query “select order_id, name from order_table where \$CONDITIONS” \
   --target-dir /user/root/order_all \ 
   --split-by id \
   -m 4  \
   --incremental lastmodified \
   --merge-key order_id \
   --check-column time \
   # remember this date !!!
   --last-value “2014-11-09 21:00:00” 
```


* 参数含义表


| **参数**                  | **说明**                                                     |
| ------------------------- | ------------------------------------------------------------ |
| –incremental lastmodified | 基于时间列的增量导入（将时间列大于等于阈值的所有数据增量导入Hadoop） |
| –check-column             | 时间列（int）                                                |
| –last-value               | 阈值（int）                                                  |
| –merge-key                | 合并列（主键，合并键值相同的记录）                           |






## 并发导入参数设置
>我们知道通过 -m 参数能够设置导入数据的 map 任务数量，即指定了 -m 即表示导入方式为并发导入，这时我们必须同时指定 - -split-by 参数指定根据哪一列来实现哈希分片，从而将不同分片的数据分发到不同 map 任务上去跑，避免数据倾斜。

### 重要Tip：

* 生产环境中，为了防止主库被Sqoop抽崩，我们一般从备库中抽取数据。
* 一般RDBMS的导出速度控制在60~80MB/s，每个 map 任务的处理速度5~10MB/s 估算，即 -m 参数一般设置4~8，表示启动 4~8 个map 任务并发抽取。


## References

- [Sqoop全量数据导入、增量数据导入、并发导入](https://blog.csdn.net/whdxjbw/article/details/81079746)
- [Sqoop安装和学习](https://www.cnblogs.com/qingyunzong/p/8807252.html)
- [sqoop官网]( https://sqoop.apache.org/ )

