---
layout:     post
title:      "数据仓库hive的使用总结 "
subtitle:   "信息、载体、抽象、线程 设计乱谈"
date:       2019-09-30
author:     "LSG"
header-img: "img/post-bg-infinity.jpg"
catalog: true
tags:
  - hadoop
  - hive
  - SQL
---

> hive的常见用法

### 1.1模型

数据仓库采用的建模方法主流的有维度建模、范式建模。主要介绍维度建模

#### 1.1 星形模型

所谓星形模型是指以事实表为中心，关联各个维度表，以获取我们所需要的数据结果。如下图，在事实表中有各个明细的数据，
通过其周围不同的维度来构建上层的数据结果。在该情况下，维表中会有部分的冗余数据。

![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578901829256-d6fad6c1-1d0e-435b-af6d-43d00ae65ec8.png#align=left&display=inline&height=708&name=image.png&originHeight=708&originWidth=781&size=179301&status=done&style=none&width=781)

#### 1.2 雪花模型

雪花模型是在星形模型的基础上，将维度表进一步细化，得到维表的维度表。如下图，在该模式下，
维度表的深度更深一些，在进行数据分析时，我们进行关联维表更多一些。因此，与星形模型相比，
其分析查询的速度稍微更弱一些，但是由于维表的细化，得到的各个维度表的冗余较少一些。
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578901836295-ccff5c95-59e8-4ef4-81aa-0f2d37b06736.png#align=left&display=inline&height=600&name=image.png&originHeight=600&originWidth=805&size=196066&status=done&style=none&width=805)
通常情况下，星形模型具有更快的分析效率，也是建模时比较倾向的。

### 2.建表语法:

#### 2.1普通表:

```sql
-- 2. 平台昵称手机表 去重依据(所有字段) stat_platform_user_mobile
DROP TABLE IF EXISTS `stat_platform_user_mobile`;
CREATE TABLE `stat_platform_user_mobile`
(
    `rowkey`         string,
    `platform_id`    INT,
    `buyer_nick`     string,
    `contact_type`   string,
    `contact_number` string
)
    row format delimited fields terminated by '\001' STORED AS orc tblproperties ("orc.compress" = "SNAPPY");
```

#### 2.2分区表:

```sql
DROP TABLE IF EXISTS `sys_goods_category`;
CREATE TABLE `sys_goods_category`(
                             `id` string,
                             `shop_id` string
                             )
PARTITIONED BY ( `create_time` string )
row format delimited fields terminated by '\001' STORED AS orc tblproperties ("orc.compress"="SNAPPY");
```

### 3.常用sql

#### 3.1 删表重命名/explain

```sql
explain SQL;
truncate table;
alter TABLE sys_goods_category RENAME TO sys_goods_category_old ;
drop table if EXISTS example_table;
```

#### 3.2 合并小文件

```sql
alter table app.example_orc partition (dt="20180505") concatenate;
alter table app.example_orc  concatenate;
```

#### 3.3 insert 动态分区表

```sql
set set tez.queue.name=task;
set hive.exec.dynamic.partition.mode=nonstrict;
set hive.exec.dynamic.partition=true;
set hive.exec.max.dynamic.partitions.pernode=100000;
set hive.exec.max.dynamic.partitions=100000;
set hive.exec.max.created.files=100000;
insert into table sys_goovalueds_category partition(create_time)
select `id`,`value`,`create_time`
from sys_goods_category_old
```

### 4.开窗函数/正则表达式/udf

#### 4.1开窗函数(去重)

```sql
select isbn4, goods_name `商品名` from (select ISBN isbn4, goods_name, 
row_number() over (distribute by isbn sort by goods_name desc) as rn 
from sys_goods_category_ISBN_201801_03) tmp5 where `rn` = 1
```

#### 4.2 正则表达式 (识别isbn的数据)

```sql
where ISBN regexp
 '^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$'
  and receiverarea not regexp '^[0-9]*$'
```

#### 4.3使用udf(对长主键 做md5运算做新主键)

```sql
SELECT MD5(CONCAT_WS('',platformid,buyernick)) AS user_id,receivermobile AS mobile_id from table
```

### 5.自总结 hive 思维导图 
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578902068718-be649a01-ebbc-414e-9240-20a22ae53448.png#align=left&display=inline&height=7244&name=image.png&originHeight=7244&originWidth=3273&size=1653833&status=done&style=none&width=3273)
