---
layout: post
title:  "my vim!"
date:   2018-10-16
categories: vim
excerpt: 如何配置自己的vim以及保存自己的配置文件(配色,插件,快捷键,常见设置)
header-img: "img/lxy006.jpg"
mathjax: true
catalog: true
author: "LSG"
tags: 
  - linux 
  - vim
---

> vim 使用的简易配置,包括文字高亮,行号切换, 文件树浏览 以及 简单的自动补全

*“vim : 神一样的编辑器 ”*



## vim:神一样的编辑器 
> Vim是一个类似于Vi的著名的功能强大、高度可定制的文本编辑器，在Vi的基础上改进和增加了很多特性。 [1]  VIM是自由软件。
>
> Vim普遍被推崇为类Vi编辑器中最好的一个，事实上真正的劲敌来自Emacs的不同变体。1999 年Emacs被选为Linuxworld文本编辑分类的优胜者，Vim屈居第二。但在2000年2月Vim赢得了Slashdot Beanie的最佳开放源代码文本编辑器大奖，
> 又将Emacs推至二线， 总的来看， Vim和Emacs在文本编辑方面都是非常优秀的。


**1.vim的设计理念是组合**
Vim强大的编辑能力中很大部分是来自于其普通模式命令。vim的设计理念是命令的组合。例如普通模式命令"dd"删除当前行，"dj"代表删除到下一行,原理是第一个"d"含义是删除,"j"键代表移动到下一行,组合后"dj"删除当前行和下一行。
另外还可以指定命令重复次数，"2dd"（重复"dd"两次），和"dj"的效果是一样的。"d^","^"代表行首,故组合后含义是删除到光标开始``到行首间的内容(不包含光标);"d$" $"代表行尾,删除到行尾的内容(包含光标);用户学习了各种各样的
文本间移动/跳转的命令和其他的普通模式的编辑命令，并且能够灵活组合使用的话，能够比那些没有模式的编辑器更加高效的进行文本编辑。
**2.很多快捷键设置和正则表达式类似,可以辅助记忆; ^ $ w 等**

**3.多插件性质**
vim的可配置性是它经久不衰的理由,你完全可以把它变成一个`ide`,不过没必要,我有`idea`

## emacs: 神用的编辑器
>emacs被称为用编辑器藏起来的操作系统~~~
>
>但在此先不学习~对于我就先用`vim`编辑器~`sublime`看代码~`idea`系列写代码~`atom`写前端~
>
## vim从下载安装到插件配置
### 下载安装
```sh
yum install vim -y
vim --version
```
### 配置:
`(这些是vim官方推荐配置,他会优先找这些文件来配置vim)`

#### 在用户(家)目录下新建.vimrc来写vim配置 

```sh
不同的用户不同的家
vim ~/.vimrc
输入set nu
:wq
```
#### 在用户(家)目录下新建.vim保存vim的插件,色彩包

```sh
mkdir ~/.vim
```
### 我的vim配置文件 [** 下载地址 vimrc**](/mysetting/.vimrc)
```sh
if v:lang =~ "utf8$" || v:lang =~ "UTF-8$"
   set fileencodings=ucs-bom,utf-8,latin1
endif

set nocompatible	" Use Vim defaults (much better!)
set bs=indent,eol,start		" allow backspacing over everything in insert mode
"set ai			" always set autoindenting on
"set backup		" keep a backup file
set viminfo='20,\"50	" read/write a .viminfo file, don't store more
			" than 50 lines of registers
set history=2000		" keep 50 lines of command line history
set ruler		" show the cursor position all the time
" 总是显示状态栏
set laststatus=2
" 显示光标当前位置
set ruler
" 开启行号显示
set number
" 高亮显示当前行/列
set cursorline
" set cursorcolumn
" 高亮显示搜索结果
set hlsearch
" 设置tab键为4  设置自动tab对齐
"set tabstop=4
"set autoindent
"set smartindent
"set expandtab
"set shiftwidth=4

"  设置引号,大括号自动的生成匹配
"inoremap " ""<ESC>i
"inoremap ' ''<ESC>i
"inoremap ( ()<ESC>i
"inoremap [ []<ESC>i
"inoremap { {}<ESC>i

" Only do this part when compiled with support for autocommands
if has("autocmd")
  augroup redhat
  autocmd!
  " In text files, always limit the width of text to 78 characters
  " autocmd BufRead *.txt set tw=78
  " When editing a file, always jump to the last cursor position
  autocmd BufReadPost *
  \ if line("'\"") > 0 && line ("'\"") <= line("$") |
  \   exe "normal! g'\"" |
  \ endif
  " don't write swapfile on most commonly used directories for NFS mounts or USB sticks
  autocmd BufNewFile,BufReadPre /media/*,/run/media/*,/mnt/* set directory=~/tmp,/var/tmp,/tmp
  " start with spec file template
  autocmd BufNewFile *.spec 0r /usr/share/vim/vimfiles/template.spec
  augroup END
endif

if has("cscope") && filereadable("/usr/bin/cscope")
   set csprg=/usr/bin/cscope
   set csto=0
   set cst
   set nocsverb
   " add any database in current directory
   if filereadable("cscope.out")
      cs add $PWD/cscope.out
   " else add database pointed to by environment
   elseif $CSCOPE_DB != ""
      cs add $CSCOPE_DB
   endif
   set csverb
endif

" Switch syntax highlighting on, when the terminal has colors
" Also switch on highlighting the last used search pattern.
if &t_Co > 2 || has("gui_running")
" 设置高亮显示
  syntax on
  set hlsearch
endif

filetype plugin on

if &term=="xterm"
     set t_Co=8
     set t_Sb=[4%dm
     set t_Sf=[3%dm
endif
" 对文件类型的判断
filetype on
filetype indent on
"  ---------------------插件设置-------------------------------------------
" 添加bundel的支持
filetype off
syntax on
set rtp+=~/.vim/bundle/vundle/
call vundle#begin()
" 加载插件
 Plugin 'VundleVim/Vundle.vim'
 " 文档资源管理器  文件的下导航
 Plugin 'Lokaltog/vim-powerline'
 " 文档树
 Plugin 'scrooloose/nerdtree'
 " color文件
 Plugin 'vim-airline/vim-airline'
 Plugin 'vim-airline/vim-airline-themes'
 Plugin 'michaelHL/awesome-vim-colorschemes'
 "Plugin 'Tagbar'
 "标签树和tag自动增加
 Plugin 'Tabular'
 Plugin 'majutsushi/tagbar'
 "tab赋予魔力
 Plugin 'SuperTab'
 "代码的提示错误
 Plugin 'Syntastic'
 "自动括号补全
 Plugin 'jiangmiao/auto-pairs'
 "注释多语言的快捷键
 "n\cc : 为光标以下 n 行添加注释
 "n\cu : 为光标以下 n 行取消注释
 "n\cm : 为光标以下 n 行添加块注释
 Plugin 'scrooloose/nerdcommenter'
 "Plugin 'MiniBufferExplorer'
 "撤销树
 Plugin 'mbbill/undotree'
 call vundle#end()
 filetype plugin indent on     " required
 "SuperTab快捷键
 "0 - 不记录上次的补全方式
 "1 - 记住上次的补全方式,直到用其他的补全命令改变它
 "2 - 记住上次的补全方式,直到按ESC退出插入模式为止
 let g:SuperTabRetainCompletionType=2
 " 插件快捷键
 " syntastic快捷键
 let g:syntastic_always_populate_loc_list = 1
 let g:syntastic_check_on_open = 1
 let g:syntastic_auto_jump = 1
 nmap <F6> :Tagbar <CR>
 nmap <F5> :NERDTreeToggle<cr>
 nmap <F4> :wq<cr>
 nmap <F1> :set nu<cr>
 nmap <F2> :set nonu<cr>
 nmap <F4> :wq<cr>
 nnoremap <F3> :UndotreeToggle<cr>
 map <F7> <Esc>:!ctags -R <CR><CR>

let &guicursor = &guicursor . ",a:blinkon0"


"             ---------------------------颜色主题设置-------------------------------------
set background=dark
"colorscheme solarized
"colorscheme molokai
"colorscheme one
"colorscheme phd
colorscheme atom
"colorscheme molokai
"            ------------------------------字体设置 #12是字体大小-------------------------
"          set guifont=Source\ Code\ Pro\ 15
"            ---------------------------颜色主题设置关闭---------------------------------
"

```
* .vim文件下载地址
*  crtl+w切换配件窗口
*  tab智能提示
*  其他看nmap

## References

- [vim如何使用插件](https://blog.csdn.net/qqstring/article/details/81511174)
- [spaceVim的入门和使用]([https://spacevim.org/cn/quick-start-guide/#docker-%E6%94%AF%E6%8C%81](https://spacevim.org/cn/quick-start-guide/#docker-支持))
- [vim菜鸟教程](https://www.runoob.com/linux/linux-vim.html)
- [在chrome安装vim插件](https://www.cnblogs.com/xdargs/p/5296715.html)