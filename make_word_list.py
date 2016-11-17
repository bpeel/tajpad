import sys

words = []

for line in sys.stdin:
    parts = line.rstrip().split("\t")
    words.append([parts[0], float(parts[1])])

words.sort(key=lambda x: -x[1])

total = sum(map(lambda x: x[1], words))
running_total = 0.0

print("words = [", end="")
x_pos = 1000

for part in words:
    running_total += part[1]
    value = running_total / total

    s = "\"" + part[0] + "\", " + str(value) + ","

    if len(s) + 1 + x_pos > 80:
        print("\n  ", end="")
        x_pos = 2
    else:
        print(" ", end="")
        x_pos += 1

    print(s, end="")
    x_pos += len(s)

print("\n]")
        
