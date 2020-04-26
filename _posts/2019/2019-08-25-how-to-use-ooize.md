---
layout:     post
title:      "HOW TO USE OOIZE"
subtitle:   "大数据调度框架 ooize 的基本使用以及图解"
date:       2019-08-25
author:     "LSG"
header-img: "img/ooize.png"
catalog: true
tags:
  - hadoop
  - ooize
  - spark
  - 调度框架
---

> **Oozie是大数据四大协作框架之一——任务调度框架，另外三个分别为数据转换工具Sqoop,文件收集库框架Flume,大数据WEB工具Hue。**

### 一. 安装和配置
配置邮件:
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578828737388-2c0995f5-4c4f-45b4-9ef5-0b223b56cc0b.png#align=left&display=inline&height=1006&name=image.png&originHeight=1006&originWidth=1499&size=148673&status=done&style=none&width=1499)

### 二 .使用和常用命令
#### 2.1 验证正确性

1. 验证wokflow.xml :  
`oozie validate /appcom/apps/hduser0401/mbl_webtrends/workflow.xml`

1. 查看oozie服务状态：
`oozie admin -oozie http://localhost:11000/oozie -status`

#### 2.2 执行,准备,提交,直接运行任务

1. 提交作业，作业进入PREP状态  submit
`oozie job -oozie http://localhost:11000/oozie -config job.properties -submit`
命令行出现: `job: jobID`

1. 执行已提交的作业  start
`oozie job -ooziehttp://localhost:11000/oozie -start jobID`

1. 直接运行作业  run  ->一般使用该方式
`oozie job -oozie http://localhost:11000/oozie -config job.properties -run`

1. 挂起和恢复
挂起->`oozie job -suspend 0000004-180119141609585-oozie-hado-C`   
恢复->`oozie job -resume 0000004-180119141609585-oozie-hado-C`

1. 杀死作业 
`oozie job -oozie http://localhost:11000/oozie -kill 14-20090525161321-oozie-joe`

1. 改变作业参数，不能修改killed状态的作业 
`oozie job -oozie http://localhost:11000/oozie -change 14-20090525161321-oozie-joe -value endtime=2011-12-01T05:00Z;concurrency=100;2011-10-01T05:00Z`

1. 重新运行作业  
`oozie job -rerun 0006360-160701092146726-oozie-hado-C  -refresh -action 477-479`
`oozie job -rerun 0006360-160701092146726-oozie-hado-C -D oozie.wf.rerun.failnodes=false`

1. 检查作业状态  
`oozie job -oozie http://localhost:11000/oozie -info 14-20090525161321-oozie-joe`

1. 查看日志  
`oozie job -oozie http://localhost:11000/oozie -log 14-20090525161321-oozie-joe`

1. 提交pig作业  
`oozie pig -oozie http://localhost:11000/oozie -file pigScriptFile -config job.properties -X -param_file params`

1. 提交MR作业 
`oozie mapreduce -oozie http://localhost:11000/oozie -config job.properties`

1. 查看共享库 :
`oozie admin -shareliblist sqoop`

1. 动态更新共享库 :
`oozie admin -sharelibupdate`

### 三. wookflow语法

```xml

<workflow-app xmlns="uri:oozie:workflow:0.2" name="Test">
    <start to="GoodsNameGroup"/>
	  <action name="GoodsNameGroup">
                <spark xmlns="uri:oozie:spark-action:0.2">
                        <job-tracker>${jobTracker}</job-tracker>
                        <name-node>${nameNode}</name-node>
                        <job-xml>${workflowAppUri}/hive-site.xml</job-xml>
                        <configuration>
                                <property>
                                        <name>oozie.action.sharelib.for.spark</name>
                                        <value>spark2 </value>
                                </property>
                                <property>
                                        <name>oozie.use.system.libpath</name>
                                        <value>true</value>
                                </property>
                                <property>
                                        <name>mapred.job.queue.name</name>
                                        <value>${queueName}</value>
                                </property>
                                <property>
                                        <name>tez.queue.name</name>
                                        <value>${queueName}</value>
                                </property>

                        </configuration>
                        <master>yarn-cluster</master>
                        <mode>cluster</mode>
                        <name>GoodsNameGroup</name>
                        <class>com.wangdian.spark.tasks.main.clear.test.GoodsNameGroup</class>
                        <jar>${jarPath}</jar>
                        <spark-opts>--executor-cores 1 --executor-memory 3584M --num-executors 20 --queue ${queueName}</spark-opts>
                </spark>
                <ok to="end"/>
                <error to="an-email"/>
        </action>
	<action name="an-email">
        	<email xmlns="uri:oozie:email-action:0.1">
        		<to>ludengke@wangdian.cn</to>
            		<subject>Email notifications for ${wf:id()} spark-test</subject>
            		<body>The wf ${wf:id()} failed completed.</body>
	        </email>
        	<ok to="kill"/>
		<error to="kill"/>
	</action>
	<kill name="kill">
		<message>Action failed, error message[${wf:errorMessage(wf:lastErrorNode())}]</message>  
	</kill>  
	<end name="end"/>
</workflow-app>
```

### 四. coordinator语法:
#### 4.1 coordinator.xml
```xml
<coordinator-app name="clear-stat-coordinator" frequency="*/10 0-17,20-23 * * *" start="${start}" end="${end}" timezone="Asia/Shanghai"
                 xmlns="uri:oozie:coordinator:0.2">
    <action>
        <workflow>
            <app-path>${workflowAppUri}</app-path>
            <configuration>
                <property>
                    <name>jobTracker</name>
                    <value>${jobTracker}</value>
                </property>
                <property>
                    <name>nameNode</name>
                    <value>${nameNode}</value>
                </property>
                <property>
                    <name>queueName</name>
                    <value>${queueName}</value>
                </property>
            </configuration>
        </workflow>
    </action>
</coordinator-app>

```
#### 4.2 job.properties
```typescript
nameNode=hdfs://cluster
jobTracker=master
examplesRoot=oozie-apps
queueName=task

# oozie.wf.application.path 标识这是一个workflow任务。
# oozie.wf.application.path=${nameNode}/user/${user.name}/${examplesRoot}/clear-stat-coordinator/workflow.xml
oozie.coord.application.path=${nameNode}/user/${user.name}/${examplesRoot}/clear-stat-coordinator/coordinator.xml
sparkopts=--executor-cores 1 --executor-memory 1g --num-executors 8 --queue ${queueName} --conf spark.yarn.maxAppAttempts=1
workflowAppUri=${nameNode}/user/${user.name}/${examplesRoot}/clear-stat-coordinator
jarPath=lib/SparkTasks.jar
statClass=com.wangdian.spark.tasks.main.stat.ExecuteSparkSqlTask
clearClass=com.wangdian.spark.tasks.main.clear.StatDateClearApiTrade
distinctClass=com.wangdian.spark.tasks.main.clear.HiveGoodsDistinctAndCategoryStatistics
start=2020-01-09T15:00+0800
end=2020-01-11T17:45+0800

```

### 五. 使用脚本来节省时间:
##### 由于每次提交任务都要上传到集群上,所以将这些命令自动化
任务提交:
`./start.sh 文件包名`

```bash
jarNumStr=`ls -ll /data/bin/oozie-apps/spark-jar-warehouse | grep SparkTasks.jar* | wc -l`
jarNum=${#jarNumStr}
min=1
if [ $jarNum -gt $min ]; then
    echo "SparkTasks.jar类似文件存在多个,请保证一个最新版本"
    exit 1
fi
hadoop fs -rm -r /user/hdfs/oozie-apps/$1
hadoop fs -put  $1 /user/hdfs/oozie-apps/
oozie job -oozie http://hadoop03:11000/oozie -config $1/job.properties -run
```

### 六. 常见实例图解:
#### 6.1 执行开始:
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578829307117-869414b3-ca89-4acf-9fb0-da713a6a4b04.png#align=left&display=inline&height=4685&name=image.png&originHeight=4685&originWidth=3205&size=1010853&status=done&style=none&width=3205)
#### 6.2 执行完毕:
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578829331612-9adb0d24-879b-4e2c-a496-e3c564f78c9b.png#align=left&display=inline&height=4175&name=image.png&originHeight=4175&originWidth=2345&size=654169&status=done&style=none&width=2345)
### 七.ooize执行,长时间处于prep的一次优化
#### 7.1 ooize prep状态
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578829431409-2bdb3c36-300a-4b89-be3b-c0c0f65cfd57.png#align=left&display=inline&height=723&name=image.png&originHeight=723&originWidth=1046&size=88102&status=done&style=none&width=1046)
#### 7.2发现原因是Yarn 中application太多了,导致两个问题:1.页面访问变慢2.ooize提交任务变慢
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578829730063-871a2132-68b6-436f-b81f-85f1497566ca.png#align=left&display=inline&height=654&name=image.png&originHeight=654&originWidth=639&size=69720&status=done&style=none&width=639)
#### 7.3 解决办法:

1. 删除log日志10000多个appl,省出大概800G空间,  (自己集群设置的hdfs的位置)
1. 删除zk上applacation任务,  (默认位置:  `zookeeper中:  rmr /rmstore/ZKRMStateRoot/RMAppRoot` )
1. 重启ooize




- 删除前

![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578829568732-7c377e3f-4a5b-4f49-a2c9-8400601b6460.png#align=left&display=inline&height=142&name=image.png&originHeight=142&originWidth=1373&size=78397&status=done&style=none&width=1373)

- 删除后:

![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578829607117-a2e78395-df1a-4f08-8097-40a8476b6e7e.png#align=left&display=inline&height=152&name=image.png&originHeight=152&originWidth=1001&size=15448&status=done&style=none&width=1001)
**最后问题解决!**

### Reference

* [ooize官网](http://oozie.apache.org/)
* [什么是Oozie——大数据任务调度框架](https://blog.csdn.net/TNTZS666/article/details/81915820)
* [ooize学习](https://www.cnblogs.com/cac2020/p/10509950.html)