# 基于 tinypng 的压缩数量不限的图片压缩组件

## 📦 安装

```bash
yarn global add @kiner/img-min
```

## 🔧 使用

```bash
# 查看命令帮助
kim -h
# 压缩目标 test 目录下的所有图片并输入到 test/output 目录
kim -s "./test" -o "./output"
# 压缩单个文件
kim -s "./test/1.jpg" -o "./output"
```