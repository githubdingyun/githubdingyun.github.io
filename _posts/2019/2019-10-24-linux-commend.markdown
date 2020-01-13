---
layout:     post
title:      "Linux 常用监控命令 "
subtitle:   "信息、载体、抽象、UI 设计乱谈"
date:       2019-10-24
author:     "LSG"
header-img: "img/post-bg-os-metro.jpg"
catalog: true
tags:
  - linux
  - OS
---


> 很多时候项目出现的问题不是代码的问题,是运维的问题,下面是日常工作排查机器问题的常用命令

## 前言
linux 运维监控包括很多维度: 磁盘,io,网络,负载,端口监控,日志记录 等等


*“总而言之,万物皆文件就是Linux”*

## 磁盘监控
 * ```df -lh```
 * ```du -sh /data/*```
## 删除线上日志

* true > INFO-
* true > ERROR-

## cpu监控

* ```top```
* ```htop```
## 进程监控
* ```jps```
* ```ps -ef | grep ```
## 端口监控
* ```netstat -antlp | grep -i 9000```
## 最大文件数
* ```file```
## ip设置与查看
* ```ifconfig```
* ```cat /etc/hosts```
## 内存监控
* ```free -m```
## io监控
* ```iostat -d 磁盘 ```
## 文件压缩
* 压缩: ```tar -czvf my.tar file1 file2,...```
* 解压缩到当前目录: ```tar xzvf my.tar ...```
## [服务注册](https://www.cnblogs.com/quchunhui/p/10019202.html)
* 编写service.run文件,放到usr/lib/systemd/system/下并授权即可
## 历史记录查看
* ```history | grep ```                                   ->   只能查看所登录用户的历史记录
## 文件查找
* ```find -name xxx /```
* ```locate xxx ```             -> ```dbupdate```
## 网络io
* ```iftop```
* 不加-B是带宽 bit,加-B是网速  bytes
* ```iftop -F 203.119.169.0/24 -B```  
## 大文件查看
之前再用vim打开大约4G的日志文件的时候,发现使用vim查看大日志会占用很多内存,并把线上服务给挤下去
并且有一次因为日志设置的不合理,一天的日志大小达到了200多G(zk链接不上,报错触发的日志错误)
* ```tail -n 100  xxx```
* ```head -n 100  xxx```
* ```tail -f xxx```
## 用户权限
* ```sudo su root```
* ```delgroup```
* ```add user```
## top/htop/ps命令的由来
* ```/proc/$pid/xxx```
* ```$pid``` ```ppid```
## 跨服务器操作
* ```scp [user@]host1:]file1 ... [[user@]host2:]file2 ```
* ```ssh $user@$host "source /etc/profile;command"```
## 使用脚本对多台服务器进行**命令**操作:

```sh
#!/bin/bash

# 快捷操作脚本
#
# 在除kafka01 kafka02这两台机器上执行创建文件夹的命令
#   ./control.sh "mkdir /data/log/control" "kafka01 kafka02"
# 集群内复制文件
#   ./control.sh "scp kafka01:/data/log/control/a.sh $PWD"
#
# $1 需要执行的命令 注意使用双引号
# $2 需要排除的机器 注意使用双引号

user="hadoop"

for host in hadoop01 hadoop02 hadoop03 hadoop04 hadoop05 hadoop06 hadoop07 hadoop08 hadoop09 hadoop10
do
    if [[ $2 =~ $host ]]; then
echo "Skip the machine $host"
else
echo "Handling... ${host} [ $1 ]"
ssh $user@$host "source /etc/profile;${1}"
fi
done
https://blog.csdn.net/wodeyuer125/article/details/51918408

```


## scp实现一个文件 *多机器多源* 复制脚本

```sh
#!/bin/sh
 
print_usage()
{
  echo "语法一，以相同的用户名、目标名称复制文件: bscp -ut[r] sourceDir user targetDir host1 host2…"
  echo "语法二，以相同的用户名、不同的目标名称复制文件: bscp -u[r] sourceDir user host1:targetDir1 host2:target2…"
  echo "语法三，不同的用户名、相同的目标名称复制文件: bscp -t[r] sourceDir targetDir user1@host1 user2@host2…"
  echo "语法四，用户名、目标名称均不同: bscp [-r] sourceDir user1@host1:targetDir1 user2@host2:targetDir2…"
}
argNumber=$#
# 如果没有参数则打印使用方法
if [ $argNumber -le 1 ]; then
  print_usage
  exit 1
fi
 
COMMAND=$1
#shift
 
case $COMMAND in
  (--help|-help|-h|help)
    print_usage
    exit 0
    ;;
esac
 
if [ "${COMMAND:0:1}" != "-" ];then
  shift
  args="$@"
  for i in $args 
  do
       scp $COMMAND $i
  done
else
  length=${#COMMAND}
  #echo $length
  if [ $length -eq 4 ]; then
    shift
    if [ $# -le 3 ];then
      print_usage
      exit 1
    fi
    source=$1
    targetUser=$2
    targetDir=$3
    shift 3
    args="$@"
    for i in $args
    do
      scp -r $source $targetUser@$i:$targetDir
      #echo $targetUser
    done
  elif [ $length -eq 3 ]; then
    shift
    source=$1
    if [ `expr index "$COMMAND" r` -eq 0 ]; then
     if [ $# -le 3 ]; then
      print_usage
      exit 1
     fi
     targetUser=$2
     targetDir=$3
     shift 3
     args="$@"
     for i in $args
     do
      scp  $source $targetUser@$i:$targetDir
     done
    else
     if [ `expr index "$COMMAND" u` -gt 0 ]; then
       if [ $# -le 2 ]; then
         print_usage
         exit 1
       fi
       targetUser=$2
       shift 2
       args="$@"
       for i in $args
       do
         scp -r $source $targetUser@$i
       done
     elif [ `expr index "$COMMAND" t` -gt 0 ]; then
       if [ $# -le 2 ]; then
         print_usage
         exit 1
       fi
       targetDir=$2
       shift 2
       args="$@"
       for i in $args
       do
         scp -r $source $i:$targetDir
       done
     else
       print_usage
       exit 1
     fi
    fi
   elif [ $length -eq 2 ]; then
     shift
     source=$1
     if [ `expr index "$COMMAND" u` -gt 0 ]; then
       if [ $# -le 2 ]; then
         print_usage
         exit 1
       fi
       targetUser=$2
       shift 2
       args="$@"
       for i in $args
       do
         scp  $source $targetUser@$i
       done
     elif [ `expr index "$COMMAND" t` -gt 0 ]; then
       if [ $# -le 2 ]; then
         print_usage
         exit 1
       fi
       targetDir=$2
       shift 2
       args="$@"
       for i in $args
       do
         scp  $source $i:$targetDir
       done
     elif [ `expr index "$COMMAND" r` -gt 0 ]; then
       if [ $# -le 1 ]; then
         print_usage
         exit 1
       fi
       shift 1
       args="$@"
       for i in $args
       do
         scp  -r $source $i
       done
     else
       print_usage
       exit 1
     fi  
  else
     print_usage
     exit 1  
  fi
fi

```

## 日志批量删除脚本(微服务为例)

```sh
#!/bin/bash
find /data/bin/micro_service/log/GateWay/**/  -mtime +1 -name "*.log" -exec echo {} > /logname.txt \;
find /data/bin/micro_service/log/EurekaServer/**/  -mtime +1 -name "*.log" -exec echo {} > /logname.txt \;
find /data/bin/micro_service/log/BranchGetWay/**/  -mtime +1 -name "*.log" -exec echo {} > /logname.txt \;
find /data/bin/micro_service/service/   -name "branchgetway.log" -exec echo {} >> /logname.txt \;
find /data/bin/micro_service/service/  -name "eurekaserver.log" -exec echo {} >> /logname.txt \;
find /data/bin/micro_service/service/  -name "gateway.log" -exec echo {} >> /logname.txt \;
find /data/bin/micro_service/service/  -name "securityserver.log" -exec echo {} >> /logname.txt \;
find /data/bin/micro_service/service/  -name "nohup.out" -exec echo {} >> /logname.txt \;

for logfile in `cat /logname.txt`
do
 echo $logfile
 true > $logfile
done
```

## 脚本开机启动

### 　　方法1.使用 /etc/rc.d/rc.local，自动启动脚本

```sh
# 例子
touch /var/lock/subsys/local  
```

1.  授予 /etc/rc.d/rc.local 文件执行权限
    命令：chmod +x /etc/rc.d/rc.local
2.  在文件文件底部添加脚本
3.  重启服务器，查看脚本是否启动
  注意：/etc/rc.d/rc.local脚本执行，在/etc/profile之前，若/etc/rc.d/rc.local用到/etc/profile的环境变量，Shell无法执行成功

### 方法2.注册服务