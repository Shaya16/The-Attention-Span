---
title: "Hello, blog"
description: "Why I'm writing this and what to expect."
pubDate: 2026-05-23
tags: ["meta"]
---

This is a plain markdown post — no interactive components, just prose
and maybe a little code:

```python
import torch
import torch.nn as nn

class TinyAttention(nn.Module):
    def __init__(self, d):
        super().__init__()
        self.q = nn.Linear(d, d)
        self.k = nn.Linear(d, d)
        self.v = nn.Linear(d, d)

    def forward(self, x):
        q, k, v = self.q(x), self.k(x), self.v(x)
        scores = (q @ k.transpose(-2, -1)) / (x.size(-1) ** 0.5)
        weights = scores.softmax(dim=-1)
        return weights @ v
```

Not every post needs an interactive demo. Some posts are short notes,
reading logs, or sketches. That's fine — they just look like this.

See the next post for the interactive bits.
