total = 0
for i in range(1, 3):
    for j in range(1, 3):
        if i == j:
            continue
        total = total + i + j
    print(total, i)
