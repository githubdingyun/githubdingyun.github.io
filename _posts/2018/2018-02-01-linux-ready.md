---
layout:     post
title:      "一台linux虚拟机或网络机器的初步配置"
subtitle:   "linux 网络,网卡,软件安装 配置"
date:       2018-02-01
author:     "LSG"
header-img: "img/post-bg-universe.jpg"
catalog: true
tags:
  - linux
  - yum
  - network
---

> 在一台刚配置好的linux机器上,我们需要对其进行网络,网卡,包管理器等进行初步配置

## 一.网络设置

#### 1.1 安装虚拟机

>最小化安装以及后的磁盘挂载

#### 1.2 设置网络区段
>在虚拟机的虚拟网络配置中,把虚拟机调成net8
>
>然后设置网关  **x.x.x.2**
>
>设置网络地址以及smac重新生成
```markdown
nat和桥接
├──nat
└── nat虚拟机住在宿主机里面(windows),虚拟机会多一个vmnet8虚拟网卡,
└── 网卡vmnet8->本地连接->路由器->局域网  
 虚拟个路由器,最后和主机共享一个ip
		└── 配置流程:   本机ip   网关: 1被net8占用,2被网关占用
├──桥接
		└── 会和宿主机公用局域网ip地址           会占用一个真实的路由器ip  
		└── 网卡->VMnet1->路由器->局域网
```
#### 1.3克隆虚拟机
>  注意机器是可以拍摄快照的  一段时间后拍摄快照来做好备份工作
#### 1.4网卡重设+配置
**3个位置:**

- /etho网络配置文件
>文件配置网络信息  :etc/sysconfig/network-scripts/ifcfg-eth0

```properties
DEVICE=eth0                                                                                                                                            
HWADDR=00:0C:29:01:36:BB
TYPE=Ethernet
UUID=1c970407-3e9f-492a-b987-a26dd370da46
ONBOOT=yes
NM_CONTROLLED=yes
BOOTPROTO=static
#大众所周知的DNS服务器
DNS1=114.114.114.114
#ali的DNS服务器
DNS2=223.5.5.5
# 谷歌的域名解析
DNS3=8.8.8.8
IPADDR=192.168.101.3
NETMASK=255.255.255.0
GATEWAY=192.168.101.2
```
- /etc/udev  

网卡信息,因为虚拟机克隆会在该文件下添加默认网卡,要进行默认配置才能够使eth0生效:

`cd /etc/udev/rules.d && vim 70-persistent-net.rules`

```properties
# PCI device 0x8086:0x100f (e1000)
SUBSYSTEM=="net", ACTION=="add", DRIVERS=="?*", ATTR{address}=="00:0c:29:01:36:bb", ATTR{type}=="1", KERNEL=="eth*", NAME="eth0"
```
- /network
* hostname :产看主机名
* 配置用户主机名
* vim /etc/sysconfig/network
* 配置本机dns映射

## 二. 软件安装

#### 2.Yum 更新为ali源

```sh
    配置文件位置:/etc/yum.repos.d/
    我们把CentOS-Base.repo这个文件备份一下,这是原来系统的源
    然后我们下载ali源,把文件改名为CentOS-Base.repo
    地址自己百度下,不同机型对应不同源
```
**对yum重新生成缓存文件:**

```sh
 清空yum的缓存   :yum clean all
 重新缓存:   yum makecache
 日后更新软件包: yum updata
```
这样一来,我们的yum就已经换源成功了,很多yum软件资源就有了
#### 	 2.2 安装第三方源  
1.	 安装epel源  12000软件 
`yum install epel-release`
2.	Rpmforge源    15000个软件  
* 安装方法:     **[CentOS使用rpmforge-release](https://www.linuxidc.com/Linux/2017-10/147386.htm)**
3. rpm安装包源:
   *  rpm  包源地址  https://centos.pkgs.org/ 
   *   安装方法   rpm -ivh   *.rpm
   *  查看安装的包: rpm –qa |grep [软件名]
   *  卸载   rpm –e –nodeps [软件名]

#### 2.3 python软件安装 

```sh
# !/bin/bash
#一个爬虫例子的安装脚本
yum install python3 -y
pip3 install  imp 
pip3 install requests
pip3 install  bs4 
pip3 install pymysql
pip3 install time
pip3 install sys
pip3 install lxml
pip3 install json
pip3 install Faker

	└── 安装了epel 和python才可以使用yum安装pip
		└── yum install python-pip  之后例如pip install iSearch
		└── 报缺少模块错误则
			└── pip install [缺省]  or easy_install ensurepip [缺省]  
```

####   2.4 其它软件手动安装方法:

		找到软件官网看文档
			└── 看readme文件
			└── 4步走   ./configure &&make &&make install

#### 2.5 其他安装使用自行解决

```shell
ssh密钥配置
java安装
环境变量配置
ntp时间工具以及定时备份工具
htop看ps工具
netstau 看网络工具
mysql安装
zsh
vim
```

