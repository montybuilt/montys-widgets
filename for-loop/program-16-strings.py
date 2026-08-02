text = "The PASSword is #44@home!"
metadata = [0, 0, 0, 0]

for char in text:
    if char.isalpha():
        metadata[0] += 1
    elif char.isdigit():
        metadata[1] += 1
    elif char.isspace():
        metadata[2] += 1
    else:
        metadata[3] += 1

print(metadata)