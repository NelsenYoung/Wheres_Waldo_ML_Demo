# Wheres_Waldo_ML_Demo

## Application Demo
![](/assets/gifs/ww_demo_gif.gif)
1. Upload a Where's Waldo image
2. Hover over the circles to zoom in on each detected characters

### Key
Yellow: Waldo
Red: Wizard Whitebeard, Wenda, Odlaw
Purple: Fan

## Installation
1. Create a virtual environment and activate it: 
```python -m venv myenv```
```source myenv/bin/activate```
2. Install dependencies:
```pip install fastapi==0.121.1 uvicorn==0.32.1 ultralytics==8.3.27 opencv-python-headless==4.10.0.84 numpy Pillow python-multipart```

## Running the application
1. Start the FastAPI backend:
```fastapi dev app.py```
2. Start a python server running the front end:
```python3 -m http.server 5500```
3. View the server at: http://localhost:5500/home.html