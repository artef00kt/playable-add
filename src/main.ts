import './style.css'
import * as PIXI from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js'

const app = new PIXI.Application({
  background: '#555555',
  resizeTo: window,
  view: document.getElementById('canvas') as HTMLCanvasElement,
});

let widescreen: boolean = app.screen.width >= app.screen.height;

let scale: number = widescreen ? app.screen.height / 1024 : app.screen.width / 1024;
let posY: number = widescreen ? app.screen.height / 10 : app.screen.height / 10;

function rescalePos(sprite: PIXI.Sprite, xS: number = 0, yS: number = 0) {
  sprite.scale.set(scale * 1.5);
  sprite.x = app.screen.width / 2 + xS*sprite.scale.x;
  sprite.y = app.screen.height / 2 - yS*sprite.scale.x - posY;
}

function initialiseSprite(sprite: PIXI.Sprite, xS: number = 0, yS: number = 0) {
  app.stage.addChild(sprite);
  sprite.anchor.set(0.5, 0.5);
  rescalePos(sprite, xS, yS);
}

const parking = PIXI.Sprite.from('assets/parking2.png');
initialiseSprite(parking);

const redP = PIXI.Sprite.from('assets/redP.png');
initialiseSprite(redP, 77, 120);
redP.interactive = true;

const yellowP = PIXI.Sprite.from('assets/yellowP.png');
initialiseSprite(yellowP, -70, 120);
yellowP.interactive = true;

const greenCar = PIXI.Sprite.from('assets/greenCar.png');
initialiseSprite(greenCar, -207, 102);
greenCar.interactive = true;

const blueCar = PIXI.Sprite.from('assets/blueCar.png');
initialiseSprite(blueCar, 207, 102);
blueCar.interactive = true;

const redCar = PIXI.Sprite.from('assets/redCar.png');
initialiseSprite(redCar, -140, -230);
redCar.interactive = true;

const yellowCar = PIXI.Sprite.from('assets/yellowCar.png');
initialiseSprite(yellowCar, 140, -230);
yellowCar.interactive = true;

app.stage.interactive = true;

window.addEventListener('resize', () => {
  
  widescreen = app.screen.width >= app.screen.height;
  scale = widescreen ? app.screen.height / 1024 : app.screen.width / 1024;
  posY = widescreen ? app.screen.height / 10 : app.screen.height / 10;

  rescalePos(parking);
  rescalePos(greenCar, -207, 102);
  rescalePos(blueCar, 207, 102);
  rescalePos(redCar, -140, -230);

});



type coords = {
  x: number,
  y: number
}

let redPathArray: coords[] = [];
let redLine: boolean = false;
let redLineReached: boolean = false;

let yellowPathArray: coords[] = [];
let yellowLine: boolean = false;
let yellowLineReached: boolean = false;


let prevRedG: (PIXI.Graphics | null) = null;
let prevYellowG: (PIXI.Graphics | null) = null;

function drawRedLine(pathArray: coords[], carColor:('red' | 'yellow')) {
  //по непонятным для меня причинам в функцию prevRedG и prevYellowG передаются по значению, а не по ссылке, это же классы
  //поэтому использую флаг isRed
  const isRed = carColor === 'red';
  
  if (isRed) {
    if (prevRedG) {
      app.stage.removeChild(prevRedG);
    }
  } else {
    if (prevYellowG) {
      app.stage.removeChild(prevYellowG);
    }
  }

  let newG = new PIXI.Graphics();
  newG.lineStyle({
    width: 20,
    color: isRed ? 'bb2919' : 'd2bb44',
  })
  newG.moveTo(pathArray[0].x, pathArray[0].y);
  for(let i = 1; i < pathArray.length; ++i) {
    newG.lineTo(pathArray[i].x, pathArray[i].y);
  }
  app.stage.addChild(newG);

  if (isRed) {
    prevRedG = newG;
  } else {
    prevYellowG = newG;
  }
}

redCar.onpointerdown = (event: any) => {
  redPathArray = [];
  redLine = true;
  let {x, y} = event.data.global;  
  redPathArray.push({x: x, y: y});
}

yellowCar.onpointerdown = (event: any) => {
  yellowPathArray = [];
  yellowLine = true;
  let {x, y} = event.data.global;
  yellowPathArray.push({x: x, y: y});
}

const deleteDrowingRedLine = () => {
  if (redLine) {
    redLine = false;
    redPathArray = [];
    if (prevRedG) {
      app.stage.removeChild(prevRedG);
    }
  }
}

const deleteDrowingYellowLine = () => {
  if (yellowLine) {
    yellowLine = false;
    yellowPathArray = [];
    if (prevYellowG) {
      app.stage.removeChild(prevYellowG);
    }
  }
}

blueCar.onpointerenter = () => {
  deleteDrowingRedLine();
  deleteDrowingYellowLine();
};
greenCar.onpointerenter = blueCar.onpointerenter;
redCar.onpointerenter = deleteDrowingYellowLine;
yellowCar.onpointerenter = deleteDrowingRedLine;

redP.onpointerenter = () => {
  deleteDrowingYellowLine();
  if (redLine) {
    redLine = false;
    redLineReached = true;
  }
}

yellowP.onpointerenter = () => {
  deleteDrowingRedLine();
  if (yellowLine) {
    yellowLine = false;
    yellowLineReached = true;
  }
}


let countStep: number = 0;
let step: number = 5;
app.stage.on('pointermove', (event: any) => {
  
  if (redLine) {
    let {x, y} = event.data.global;
    ++countStep;

    if (countStep % step === 0) {
      redPathArray.push({x: x, y: y});
      drawRedLine(redPathArray, 'red');
    }

    const deadUpY: number = blueCar.y - blueCar.height/2;
    const deadDownY: number = yellowCar.y + yellowCar.height/2;
    if (y < deadUpY || y > deadDownY) {
      deleteDrowingRedLine();
    }
  }

  if (yellowLine) {
    let {x, y} = event.data.global;
    ++countStep;

    if (countStep % step === 0) {
      yellowPathArray.push({x: x, y: y});
      drawRedLine(yellowPathArray, 'yellow');
    }

    const deadUpY: number = blueCar.y - blueCar.height/2;
    const deadDownY: number = yellowCar.y + yellowCar.height/2;
    if (y < deadUpY || y > deadDownY) {
      deleteDrowingYellowLine();
    }
  }
});

app.stage.on('pointerup', (event: any) => {
  redLine = false;
  yellowLine = false;
});


type tweenCoordsArray = {
  x: number[],
  y: number[],
  rot: number[]
}


let tween:any = null;
let once:boolean = true;
app.ticker.add((delta) =>
{
  if (redLineReached) {
    
    if (once) {
      once = false;

      
      let redCarCoords = {
        x: redCar.x,
        y: redCar.y,
        rot: redCar.rotation
      }

      let redCarCoordsArray: tweenCoordsArray = {
        x: [],
        y: [],
        rot: []
      }

      redPathArray.forEach((data, i) => {
        redCarCoordsArray.x.push(data.x);
        redCarCoordsArray.y.push(data.y);
        if (i === 0) {
          redCarCoordsArray.rot.push(Math.atan2(data.x - redCar.x, data.y - redCar.y));
        } else {
          redCarCoordsArray.rot.push(Math.atan2(data.x-redPathArray[i-1].x, data.y-redPathArray[i-1].y));
        }
      })

      tween = new TWEEN.Tween(redCarCoords, false)
      .to(redCarCoordsArray, 3000)
      .easing(TWEEN.Easing.Quadratic.InOut) // Use an easing function to make the animation smooth.
      .onUpdate(() => {
        redCar.x = redCarCoords.x;
        redCar.y = redCarCoords.y;
        redCar.rotation = redCarCoords.rot;
        console.log(redCarCoords.rot);
      })
      .start()
    }
    
  }
  if (tween) {
    //console.log(tween);
    tween.update(app.ticker.lastTime);
  }

});
