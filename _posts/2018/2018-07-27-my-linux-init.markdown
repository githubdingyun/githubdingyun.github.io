---
layout:     post
title:      "一台自用linux的最初配置"
subtitle:   "可以配置虚拟机上的linux,如果自己主力机是linux也能使用这些好工具"
date:       2018-07-27
author:     "LSG"
header-img: "img/post-bg-css.jpg"
catalog: true
tags:
	-linux
	-tmux
	-oh my zsh
---

# 安装内容 ：按照次序~~(暂时不安装一些插件)

- **包管理工具** **yum的更新和基本使用**

- **一套安全协议   openssh**

- **上传下载工具  lrzsz**

- **远程仓库  git**

- **编辑器  vim**

- **一款终极脚本语言  on my zsh**

- **分窗工具  tmux**

- **最好用的vim配置 vimspf13-vim** 

- **安装网络下载工具 wget**

# Yum

## 介绍：

一款centos7下的包管理工具，我们可以它来进行linux本该复杂的安装工作：

## 常用命令：

- 1.列出所有可更新的软件清单命令：yum check-update

- 2.更新所有软件命令：yum update  执行结果![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532574909641-c5869591-4815-4216-8f26-463c0f7701f5.png)

  图1-1

- 3.仅安装指定的软件命令：yum install <package_name>

- 4.仅更新指定的软件命令：yum update <package_name>

- 5.列出所有可安裝的软件清单命令：yum list

- 6.删除软件包命令：yum remove <package_name>

- 7.查找软件包 命令：yum search <keyword>

- 8.清除缓存命令:

- - yum clean packages: 清除缓存目录下的软件包

- - yum clean headers: 清除缓存目录下的 headers

- - yum clean oldheaders: 清除缓存目录下旧的 headers

- - yum clean, yum clean all (= yum clean packages; yum clean oldheaders) :清除缓存目录下的软件包及旧的headers

## 使用国内 yum 源



网易（163）yum源是国内最好的yum源之一 ，无论是速度还是软件版本，都非常的不错。



将yum源设置为163 yum，可以提升软件包安装和更新的速度，同时避免一些常见软件版本无法找到。



### 安装步骤



首先备份/etc/yum.repos.d/CentOS-Base.repo



```
mv /etc/yum.repos.d/CentOS-Base.repo /etc/yum.repos.d/CentOS-Base.repo.backup
```



下载对应版本 repo 文件, 放入 /etc/yum.repos.d/ (操作前请做好相应备份)



- [CentOS5](http://mirrors.163.com/.help/CentOS5-Base-163.repo) ：http://mirrors.163.com/.help/CentOS5-Base-163.repo

- [CentOS6](http://mirrors.163.com/.help/CentOS6-Base-163.repo) ：http://mirrors.163.com/.help/CentOS6-Base-163.repo

- [CentOS7](http://mirrors.163.com/.help/CentOS7-Base-163.repo) ：http://mirrors.163.com/.help/CentOS7-Base-163.repo



```
wget http://mirrors.163.com/.help/CentOS6-Base-163.repo
mv CentOS6-Base-163.repo CentOS-Base.repo
```



运行以下命令生成缓存



```
yum clean all
yum makecache
```



除了网易之外，国内还有其他不错的 yum 源，比如中科大和搜狐。



中科大的 yum 源，安装方法查看：https://lug.ustc.edu.cn/wiki/mirrors/help/centos



sohu 的 yum 源安装方法查看: http://mirrors.sohu.com/help/centos.html

# openssh

## 安装命令：



```
yum -y install openssh-clients
```



![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532579332353-0d602a50-f1e7-4921-aa58-8a461555681b.png)

# wget

```
yum -y install wget
```



# lrzyv

```
yum -y install lrzsz
```

![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532579426121-b98751ea-9458-4c64-890b-2aa0ebac594d.png)

# git

```
yum -y install git
 具体学习地址：
https://www.liaoxuefeng.com/wiki/0013739516305929606dd18361248578c67b8067c8c017b000
```

# vim

```
yum search vim
 yum -y install vim
```

![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532583555435-d8bd3780-18d8-4d3d-b014-56c8b7a98d43.png)

# on my zsh

## 为什么要使用这款sh



### **色彩高亮**



并不是传统基于正则表达式的色彩高亮，而是真的会判断你输入的是啥的色彩高亮![img](https://pic1.zhimg.com/80/v2-40c20690ceee02ebde6db7f5df326104_hd.jpg)



白色代表普通命令或者程序，红色代表错误命令，这个很管用，你再一个个字母的敲命令，前面都是红色的，如果敲对了最后一个字母的话，你会看到整条命令连着前面的都变成了白色，代表你敲对了。以前无高亮的时候敲错了都不知道，还要往上翻着左右检查。下面青色的代表内建命令或者 alias （echo 和 ls ），这些都不是正则判断出来的，是真的去检查的。



细心的人会发现非零的错误码，也会高亮显示在最右边（上一条 data命令错误，返回127）。



### **命令提示**



注意，命令提示和补全是两个完全不同的系统，很多时候提示比补全更有用：![img](https://pic1.zhimg.com/80/v2-92456634e7cc56cec0fdb5384d620f10_hd.jpg)



你才输入完 “tar”命令，后面就用灰色给你提示 tar 命令的参数，而且是随着你动态输入完每一个字母不断修正变化：

 ![img](https://pic1.zhimg.com/80/v2-adb8d887099606dbe6d556646bb8e5e4_hd.jpg)



比如你输入到 - 后，没有跟着它上面的提示，而是输入了一个c字母，它马上明白你是要压缩，不是解压，然后随即给出你压缩对应的命令提示。



这个命令提示是基于你的历史命令数据库进行分析的，随着你输入的命令越来越多，提示将会越来越准确和顺手，某些不常输入的命令特别管用，比如偶尔查看下网卡配置：![img](https://pic2.zhimg.com/80/v2-483da0e6171e62138a3aa3f28d439be9_hd.jpg)



刚输入完：cat /etc/n 它后面已经猜出你可能要查看网卡配置了，然后马上给出你提示，用不着你 tab 补全半天，你才敲 gc ，它就猜测出你可能想运行 gcc，然后马上给出完整建议：![img](https://pic4.zhimg.com/80/v2-0cfb9d79124b029c4ede7c96ec301baf_hd.jpg)



如果你觉得它提示的正确，你可以 CTRL+F 表示采纳，后面就会自动帮你一次性全部输入完了，不用一个字一个字的照着敲。前面的高亮就不说了，用惯这套提示系统，你就再也难以回到光秃秃的 bash 时代了。



### **智能补全**



传统 shell 的补全在 zsh 面前基本都可以下班了：![img](https://pic1.zhimg.com/80/v2-73f8285c7e125dfe222e1bc882cb09b4_hd.jpg)



即便可以在终端下舒适工作的人，面对有些任务也会觉得烦躁，比如频繁的切换路径，这种缩写路径补全是我用 zsh 的一大痛点之一，特别是路径比较长的时候，比如 OS X 下工具链层层套的那种路径，比如某 java 代码树，有了这种缩写补全，能让你切换路径流畅不少。



当补全内容较多时，不用像 bash 一样持续提示你需要继续输入，也不会像 cmd 永无止境的循环下去，连续敲击两次 TAB 键 zsh 给你一个补全目录，让你上下左右选择：![img](https://pic4.zhimg.com/80/v2-0f4115018c103b922900bcda1c2513b7_hd.jpg)



这叫**选择模式**，由两次连续 TAB 进入，进入后，除了 tab/shift+tab 可以前后切换外，你还可以使用光标键上下左右移动，或者使用 emacs 键位：ctrl + f/b/p/n (左右上下：forward, backward, previous, next) 。如果你觉得光标键太远难按，CTRL+f/b/p/n 太伤小拇指，可以跟我一样新定义出一套：ALT+hjkl （左下上右）来选择，十分顺手。回车表示确认选择，用 CTRL+G 表示退出。



命令参数补全更不在话下，输入 svn 后面按 TAB：![img](https://pic1.zhimg.com/80/v2-5ac9821d2001502d4530dd258cbfc3b4_hd.jpg)



就出现了 svn 的参数，这种一级参数补全基本只会对很少用的命令才有效果，svn/git 这种一级参数基本都不需要补全的，我们一般会需要到二级参数补全，比如已经输入了 svn commit，但是有一个 commit 的参数我忘记了，我只记得两个减号开头的，于是：![img](https://pic3.zhimg.com/80/v2-4101f36a2ca6c78d04e657b6816cc68e_hd.jpg)



这时候两次 TAB 进入选择模式就比较管用了，svn 的二级参数往往很长，选择模式比如信任 server 那个，选择完回车确认，或者 CTRL+G 退出选择模式。



zsh的补全真的太强了，我这里只说了十分之一不到，没法一一展开了，但就上面几个已经让我有充分的理由切换到 zsh 了。



### **快速跳转**



前面也说过命令行工作中，不同的路径间切来切去是个头疼的问题，除了上面提到的缩写补全外，有无更快的办法让我马上切换到我最近跳转过的某个路径？当然有“cd -”命令：![img](https://pic4.zhimg.com/80/v2-ac647db39cecd9a4776205f905be2f4f_hd.jpg)



输入 cd 后面加一个减号后，按一次 tab 马上就列出本次登陆后去过的最近几次路径，接着根据下面的提示输入数字按回车就过去了，比如输入：



```
$ cd -5 <回车>
```



就跳转到 ~/software/libclang-python3 路径下了。当然你还可以不输入数字，而是再按一次 tab 进入选择模式，上下键或者 ctrl+n/p 来选择，回车确认，ctrl+g 返回。



**自动跳转**



有了前面的路径缩写展开，和这里的最近访问路径切换，你已经没法再回到过去那种按部就班输入路径外加点弱智补全的方式了，但是可能你还会问，能否更进一步，不限于本次登陆或者最近去过的几级路径，有没有办法让我快速进入自我开始用 zsh 之后进入过的某个路径呢？当然可以，我们用 z 命令，查看历史上进入过的目录：![img](https://pic1.zhimg.com/80/v2-e2dce5c9e768b300c3fc32cd51c2dc48_hd.jpg)



敲入 z 命令，列出了自从我开始用zsh进入过的目录和他们的权重，进入次数越多，权重越大，便于演示，我删除了我的历史，随便 cd 了一下，保持列表的简洁。z 后面加一个关键词就能跳转到所有匹配的历史路径中权重最高的那个了：![img](https://pic2.zhimg.com/80/v2-6b84e43fabc2c80140bae9dfac02d67d_hd.jpg)



比如所有历史路径都包含 o ，那么 z o 就会跳转到权重最高的 ~/software 目录中。使用：“z -l foo" 可以列出包含 foo 的所有历史路径：![img](https://pic3.zhimg.com/80/v2-5441d3c7f003838c0d2b1428f1972e02_hd.jpg)



比如我们查询包含关键字为 c 的所有历史路径和他们的权重，有时你搞不清楚权重，可能会跳转错了，比如有两个路径：



```
project1/src
project2/src
```



那么你 z src 的时候可能并不能如你愿跳转到你想要去的路径，那怎么办呢？第一个办法是实际 cd project1/src 过去，增加它的权重，权重超过 project2/src 那么下次 z src 的时候就会跳转过去，你可以实时用 z -l src 查看包含 src 的所有路径权重。



更加可靠的方法是，增加一个关键字，比如 z 1 src ，空格分隔多个关键字，z会先匹配出第一个来，比如1 ，然后再匹配第二个 src ，马上锁定 project1/src 了。大家实际使用起来，一般是 z + 最后一级目录名，比如：



```
$ z vim     # -> /home/skywind/software/vim
$ z tmp     # -> /home/skywind/tmp
$ z local   # -> /home/skywind/.local
```



99%的时候这样做就足够了，当没有按照你要求跳转的时候，你可以再补充一下再上一级目录的一些信息，比如 z vim/src 或者 z v src 都可以，弄不明白会跳转到哪里，可以随时用：



```
$ z -l key1 [key2 ... ]
```



查看权重。不过常使用你根本必担心这个问题，基本上常去的地方，z 都是指哪打哪。如果说前面的路径缩写展开和最近访问快速切换是火箭的话，z 就是加速燃料了。



熟练的掌握上面几点内容，可让你体验到在终端里溜冰的感觉，再也没有泥里走路的抓狂。



### **热键绑定**



zsh 里面使用 bindkey 命令可以设置一系列热键，用来运行某一个 zsh 内部命令或者某个 shell 命令，谁规定终端只能敲字母呢？我们还可以按热键，比如从网上下载了一个 tar 包解开后要稍微浏览一下里面的内容，用的最多的两条命令是啥呢？第一条是 ls 命令，每到一个子目录都要先按一下，还有就是 cd .. 对吧，经过配置：



```
bindkey -s '\eo'   'cd ..\n'    # 按下ALT+O 就执行 cd .. 命令
bindkey -s '\e;'   'ls -l\n'    # 按下 ALT+; 就执行 ls -l 命令
```



你还可以设置一键打开编辑器，或者一键帮你输入某常用命令的一部分。除了这些命令外，日常命令编写也可以加强一下：



```
bindkey '\e[1;3D' backward-word       # ALT+左键：向后跳一个单词
bindkey '\e[1;3C' forward-word        # ALT+右键：前跳一个单词
bindkey '\e[1;3A' beginning-of-line   # ALT+上键：跳到行首
bindkey '\e[1;3B' end-of-line         # ALT+下键：调到行尾
```



敲命令时经常需要对已有命令进行修改，默认一个字符一个字符的跳太慢了，这样设置以后基于单词的跳转快速很多，配合其他一些快捷键，修改命令事半功倍。



终端下从  v220t 到 xterm 规范里，按下 alt+x 会先发送一个8位 ASCII 码 27，即 ESC键的扫描吗，然后跟着 x 这个字符，也等价于快速（比如100毫秒内）前后按下 ESC 和 x。



还不会再自己的终端软件里设置允许 alt 键的同学们可以搜索下相关文章。



**如何配置？**



zsh 有多强呢？上面说的这些和我平时用的功能可能只发挥了 zsh 10% 不到的能力，我也并不是什么 zsh 专家或者脚本高手，上面所讲的五点内容对于 zsh 的全部功能来讲可能都只用到了 zsh 的九牛一毛，但是以上五点只要有一条，就已经够我放弃其他 shell 来尝试一下了。



那最后上面这些功能怎么配置的？眼熟的人应该发现这不是默认的 oh-my-zsh 框架，这只是我写的一个 100 多行的 .zshrc 小脚本，如果你想体验一下的话，可以先 apt-get 安装一下 zsh，然后打开：[https://github.com/skywind3000/vim/blob/master/etc/zshrc.zsh](https://link.zhihu.com/?target=https%3A//github.com/skywind3000/vim/blob/master/etc/zshrc.zsh)



把上面这个配置的内容复制粘贴到你的 ~/.zshrc 文件里，保存，运行 zsh 即可。头一次运行会安装一些依赖包，稍等两分钟，以后再进入就瞬间进入了。



\----



PS：想自己配置到话，推荐使 zsh 的包管理器：[antigen](https://link.zhihu.com/?target=https%3A//github.com/zsh-users/antigen) 来管理所有功能，用它配置起来比原始 oh-my-zsh 自动化多了。



看很多人都比较迷恋 zsh 的 git prompt ，我从来不用这华而不实玩意儿，让我的终端不流畅，每次没内容按下回车都要调用一大堆命令，建议大家关闭。

## 如何安装

```
sudo yum install -y zsh

安装onmyzsh   需要安装好git
wget https://raw.github.com/robbyrussell/oh-my-zsh/master/tools/install.sh -O - | sh
```

![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532584251937-0d1e4579-a877-471c-a9b3-26b5bc9c5a88.png)

## 切换zsh以及个性化：

### 切换zsh

- 在以 root 用户为前提下，oh-my-zsh 的安装目录：/root/.oh-my-zsh

- 在以 root 用户为前提下，Zsh 的配置文件位置：/root/.zshrc

- 为 root 用户设置 zsh 为系统默认 shell：`chsh -s /bin/zsh root`

- 如果你要重新恢复到 bash：`chsh -s /bin/bash root`

- 现在你关掉终端或是重新连上 shell，现在开头是一个箭头了，如下图：

- ![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532584509542-7ce1fcfd-525d-48ed-b891-27aaab8fb43f.png)

### 使用on my zsh个性化主题：

```
vim /root/.zshrc
把下图主题改为自己喜欢的   我这里经常使用ys    好记习惯
ys
agnoster
avit
blinks
```

![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532584807180-0401ac65-2f89-4c78-9bb4-b4afb61c4f36.png)

更改后：

![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532585336385-076eec40-8c6e-4ed3-b505-0ec732b0f0c9.png)

### 插件



- 启用 oh-my-zsh 中自带的插件。   **到官网中看readme是最好的老师**

- oh-my-zsh 的插件列表介绍（太长了，用源码不精准地统计下有 149 个）：https://github.com/robbyrussell/oh-my-zsh/wiki/Plugins

- 我们看下安装 oh-my-zsh 的时候自带有多少个插件：`ls -l /root/.oh-my-zsh/plugins |grep "^d"|wc -l`，我这边得到的结果是：211

- 编辑配置文件：`vim /root/.zshrc`，找到下图的地方，怎么安装，原作者注释写得很清楚了，别装太多了，默认 git 是安装的。



- `wd`

- - 简单地讲就是给指定目录映射一个全局的名字，以后方便直接跳转到这个目录，比如：

- - 编辑配置文件，添加上 wd 的名字：`vim /root/.zshrc`

- - 我常去目录：/opt/setups，每次进入该目录下都需要这样：`cd /opt/setups`

- - 现在用 wd 给他映射一个快捷方式：`cd /opt/setups ; wd add setups`

- - 以后我在任何目录下只要运行：`wd setups` 就自动跑到 /opt/setups 目录下了

- - 插件官网：https://github.com/mfaerevaag/wd

- `autojump`

- - 这个插件会记录你常去的那些目录，然后做一下权重记录，你可以用这个命令看到你的习惯：`j --stat`，如果这个里面有你的记录，那你就只要敲最后一个文件夹名字即可进入，比如我个人习惯的 program：`j program`，就可以直接到：`/usr/program`

- - 插件官网：https://github.com/wting/autojump

- - 官网插件下载地址：https://github.com/wting/autojump/downloads

- - 插件下载：`wget https://github.com/downloads/wting/autojump/autojump_v21.1.2.tar.gz`

- - 解压：`tar zxvf autojump_v21.1.2.tar.gz`

- - 进入解压后目录并安装：`cd autojump_v21.1.2/ ; ./install.sh`

- - 再执行下这个：`source /etc/profile.d/autojump.sh`

- - 编辑配置文件，添加上 autojump 的名字：`vim /root/.zshrc`

- `zsh-syntax-highlighting`

- - 这个插件会对终端命令高亮显示,比如正确的拼写会是绿色标识,否则是红色,另外对于一些shell输出语句也会有高亮显示,算是不错的辅助插件

- - 插件官网：https://github.com/zsh-users/zsh-syntax-highlighting

- - 安装，复制该命令：'git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting'

- - 编辑：`vim ~/.zshrc`，找到这一行，后括号里面的后面添加：`plugins=( 前面的一些插件名称 zsh-syntax-highlighting)`

- - 刷新下配置：`source ~/.zshrc`

# **vim**

## 简介：

> **Vim（Vi[Improved]）编辑器是功能强大的跨平台文本文件编辑工具，继承自Unix系统的Vi编辑器，支持Linux/Mac OS X/Windows系统，利用它可以建立、修改文本文件。进入Vim编辑程序:**

> ![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532586779279-94d78cf5-4123-4a62-91b0-b75fe0298faa.png)



# **vimspf13-vim** :

## 官网： https://github.com/spf13/spf13-vim

## 安装

```
curl https://j.mp/spf13-vim3 -L > spf13-vim.sh && sh spf13-vim.sh
 sh <（ curl https://j.mp/spf13-vim3 -L ）
```

![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532587475111-c32707d2-1010-45f5-8270-b72765182680.png)

### 具体插件内容 ：  我们可以在选择在使用

![img](https://cdn.nlark.com/yuque/0/2018/png/152121/1532587575217-9c37d81a-a8b6-4cf2-80b1-a8fce80bdde6.png)

## vim配置：

> **因为很多插件不会，也不想自己去下载配置，就直接使用spf13**

# tmux

## 安装：

```
yum -y install tmux
```

## 关系：



一个window可以有好多个panel

一个session可以有好多个window

一个tmux可以有好多个session。

## 使用：

ctrl+b  来看命令使用