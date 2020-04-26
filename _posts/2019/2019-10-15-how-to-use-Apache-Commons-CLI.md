---
layout:     post
title:      "Apache Commons CLI 使用说明 "
subtitle:   "信息、载体、抽象、线程 设计乱谈"
date:       2019-10-15
author:     "LSG"
header-img: "img/home-bg-o.jpg"
catalog: true
tags:
  - shell
  - Commons-CLI
  - java
---

> Apache Commons CLI 提供了很多实用的工具和类实现，方便了我们对命令行工具的开发。

### 1.Commons-CLI 介绍

> 随着科学计算可视化飞速发展，人机交互技术不断更新，但传统的命令行模式依旧被广泛应用。

Commons-CLI依旧广泛应用的原因是命令行界面要较图形用户界面节约更多的计算机系统资源,利于客户进行二次开发，方便应用程序的整合。

### 2.简单使用

```java
private static Config parseCmdLine(String[] args) {
// 1.CLI 定义阶段
    initOpt();
// 2.CLI 解析阶段
    // 初始化一个命令行解析器，一般用默认的就可以
    CommandLineParser parser = new DefaultParser();
    Config config = new Config();
    try {
        // 解析后会得到一个 CommandLine 对象
        CommandLine cmd = parser.parse(options, args);
        config = new Config();
// 3.CLI 询问阶段
        // 获取选项 -c 的参数值，如果没有则使用第二个参数所指定的默认值
        config.ssdbConfigPath = cmd.getOptionValue("c", "./ssdb.cfg");
        // 判断选项 -rm 是否存在，返回的是 boolean 值
        if (cmd.hasOption("rm")) {
            config.operation = Operation.rm;
        }
        else if (cmd.hasOption("disable")) {
            config.operation = Operation.disable;
        }
        else if (cmd.hasOption("get")) {
            config.operation = Operation.get;
        }
        else if (cmd.hasOption("mv")) {
            config.operation = Operation.mv;
        }
        else {
            config.operation = Operation.unknown;
        }
    } catch (ParseException e) {
        System.out.println(e.getMessage());
        // 解析失败是用 HelpFormatter 打印 帮助信息
        HelpFormatter formatter = new HelpFormatter();
        formatter.printHelp(
                "java ssdb-del-helper-1.0-SNAPSHOT-jar-with-dependencies.jar",
                options);
    }
    return config;
}

private static Config initOpt(String[] args) {
// 定义一个可选选项集
    Options options = new Options();
    // 添加一个选项 c ，并加上对应的简短说明，第二个参数表明这个选项是否跟有参数
    options.addOption("c", true, "configOpt file, default path is ./ssdb.cfg");

    // 定义一个选项组，这个组限定其所包含的选项是互斥的
    OptionGroup optionGroup = new OptionGroup();
    // 这里的 Option 方法只有两个参数，表明这个命令行选项不带参数
    optionGroup.addOption(new Option("rm", "remove K/V from ssdb"));
    optionGroup.addOption(new Option("disable", "disable K/V from ssdb with data remained"));
    optionGroup.addOption(new Option("get", "get value from ssdb"));
    optionGroup.addOption(new Option("mv", "mv from new client to old"));
    // 设定此选项组是必选的，从而实现上面 4 个选项必须且只能选择一个
    optionGroup.setRequired(true);
    options.addOptionGroup(optionGroup);
}

private static class Config {
    String ssdbConfigPath;
    Operation operation = Operation.unknown;
}
```

### 3.设计思想
#### 3.1 CLI 定义阶段
初始化Options:

- CLI 定义阶段的目标结果就是创建 Options 实例

代码片段:
```java
// 创建 Options 对象
Options options = new Options(); 
 
// 添加 -h 参数
options.addOption("h", false, "Lists short help"); 
 
// 添加 -t 参数
options.addOption("t", true, "Sets the HTTP communication protocol for CIM connection");
```

#### 3.2 CLI 解析阶段
创建 CommandLine 实例:

- 在 CommandLineParser 类中定义的 parse 方法将用 CLI 定义阶段中产生的 Options 实例和一组字符串作为输入，并返回解析后生成的 CommandLine。

代码片段:
```java
CommandLineParser parser = new PosixParser(); 
CommandLine cmd = parser.parse(options, args); 
 
if(cmd.hasOption("h")) { 
   // 这里显示简短的帮助信息
}
```

#### 3.3 CLI 询问阶段
通过查询 CommandLine,应用程序做出对应的判断:

- 将所有通过命令行以及处理参数过程中得到的文本信息传递给用户的代码。

代码片段:
```java
// 获取 -t 参数值
String protocol = cmd.getOptionValue("t"); 
 
if(protocol == null) { 
   // 设置默认的 HTTP 传输协议
} else { 
// 设置用户自定义的 HTTP 传输协议 
}
```

### 4.流程图
![image.png](https://cdn.nlark.com/yuque/0/2020/png/152121/1578904003536-bb7388ca-749f-46c9-b25e-f75b03a8c17e.png#align=left&display=inline&height=665&name=image.png&originHeight=665&originWidth=583&size=97228&status=done&style=none&width=583)
命令行执行流程图
### Reference

- [Java Commons-CLI 命令行参数解析](https://www.zfl9.com/java-commons-cli.html)
- [简书: java 使用 commons-cli 实现命令行参数](https://www.jianshu.com/p/cf325454be07)
- [IBM: 使用 Apache Commons CLI 开发命令行工具](https://www.ibm.com/developerworks/cn/java/j-lo-commonscli/)
