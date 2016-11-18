# Tajpad - A typing test website
# Copyright (C) 2016  Neil Roberts
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

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
        
