+++
# -----------------------------------------------------------------------------
# 默认内容模版 (Default Archetype)
# 作为项目的通用基础模版。
# -----------------------------------------------------------------------------

# [必填] 标题
title = "{{ replace .File.ContentBaseName "-" " " | title }}"

# [必填] 描述
description = ""

# [必填] 提示词
prompt = """
"""

# [必填] 标签
tags = []

# [选填] 模型
model = ""

# [选填] 封面图
image = ""

# [自动] 创建日期
date = '{{ .Date }}'

# [系统] 草稿状态
draft = true

# [选填] 作者
author = ""

# [选填] 来源
source = ""
+++

# {{ replace .File.ContentBaseName "-" " " | title }}
