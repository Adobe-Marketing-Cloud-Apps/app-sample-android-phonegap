#!/bin/bash

if [ $# -ne 2 ]
  then
    echo "This script requires exactly 2 arguments: brand_name followed by app_name"
    echo "For example: ./customize-app.sh Geometrixx ShapesCon"
    exit 1
fi

find . -name brand_name_placeholder -type d -depth -execdir mv {} $1 \;
find . -name app_name_placeholder -type d -depth -execdir mv {} $2 \;
find . -name app_name_placeholder-dev -type d -depth -execdir mv {} $2-dev \;

find . -type f \( -name '*.xml' -o -name '*.jsp' -o -name index.html -o -name config.json \) -depth -exec sed -i '' s/brand_name_placeholder/$1/g {} \;
find . -type f \( -name '*.xml' -o -name '*.jsp' -o -name index.html -o -name config.json \) -depth -exec sed -i '' s/app_name_placeholder/$2/g {} \;

echo "Finished customizing app with $1 brand name and $2 app name."