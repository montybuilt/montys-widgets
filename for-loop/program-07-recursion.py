def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)

answer = factorial(4)
print(answer)
