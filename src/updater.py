import re
import subprocess
from typing import Tuple
from datetime import date


def update_str_age(age: int, text: str):
    return re.sub(r"Kiizuha Kanazawa\*\* \(\[\*\*\d+\*\*\]", rf"Kiizuha Kanazawa** ([**{age}**]", text)

def calculate_age(born: date):
    today = date.today()
    return today.year - born.year - ((today.month, today.day) < (born.month, born.day))

def generate_card() -> Tuple[str, str]:
    COMMAND_ARGS = ["npm", "run", "build:run"]
    p = subprocess.Popen(args=COMMAND_ARGS, stdout=subprocess.PIPE)
    print(p.communicate()[0].decode())
    p.stdout.close()

def update_readme():
    with open("README.md", "r+", encoding="utf-8") as f:
        text = f.read()
        f.seek(0)
        born = calculate_age(date(2001, 7, 1))
        text = update_str_age(born, text)
        f.write(text)


if __name__ == '__main__':
    generate_card()
    update_readme()
