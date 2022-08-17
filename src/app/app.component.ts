import {DOCUMENT} from '@angular/common';
import {Component, Inject, ViewEncapsulation} from '@angular/core';
import {SCALE_MODES} from '@pixi/constants';
import {Viewport} from 'pixi-viewport';
import * as PIXI from 'pixi.js';
import {CanvasRenderer} from 'pixi.js-legacy';

export class PixiApplication {
  renderer: CanvasRenderer | PIXI.Renderer;
  ticker: PIXI.Ticker;
  stage: PIXI.Container;

  constructor() {
    this.renderer = new PIXI.Renderer({
      backgroundColor: 0xffffff,
      resolution: 1,
      autoDensity: true,
      antialias: true,
      height: 700,
      width: 1000,
    });

    this.ticker = new PIXI.Ticker();
    this.stage = new PIXI.Container();

    this.ticker.add(this.render.bind(this), PIXI.UPDATE_PRIORITY.LOW);
    this.ticker.start();
  }

  get screen() {
    return this.renderer.screen;
  }

  render() {
    this.renderer.render(this.stage);
  }

  destroy() {
    this.ticker.destroy();
    this.renderer.destroy(true);
    this.stage.destroy({ texture: true, baseTexture: true });
  }
}

function downloadURI(uri: string, name: string) {
  const link = document.createElement("a");
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  title = 'untitled';

  constructor(
    @Inject(DOCUMENT)
    private readonly document: Document,
  ) {

    const viewport = this.initCanvasAndReturnViewport();

    const width = 200;
    const height = 200;

    //const tex = new PIXI.Texture(
    //  new PIXI.BaseTexture(
    //    new PIXI.SVGResource(this.getImageUrl(width, height), { width, height }),
    //    {
    //      scaleMode: SCALE_MODES.NEAREST,
    //    }
    //  )
    //);
    //
    //const sprite = new PIXI.Sprite(tex);
    //viewport.addChild(sprite);

    this.loadImage(width, height).then(image => {
      const canvas = document.createElement('canvas');
      const scale = 4;
      canvas.width = width * scale;
      canvas.height = height * scale;
      //canvas.classList.add('img-canvas');
      //image.classList.add('img-svg');
      const context = canvas.getContext('2d')!;

      context.drawImage(image, 0, 0);

      //this.document.body.appendChild(canvas);
      //this.document.body.appendChild(image);

      const tex = new PIXI.Texture(
        new PIXI.BaseTexture(
          new PIXI.CanvasResource(canvas),
        )
      );

      const sprite = new PIXI.Sprite(tex);
      viewport.addChild(sprite);
    });
  }

  loadImage(width: number, height: number): Promise<HTMLImageElement> {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        resolve(image);
      };

      image.src = this.createImageAndGetItsUrl(width, height);
    });
  }

  createImageAndGetItsUrl(width: number, height: number): string {
    const mySvg2 = `
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          polygon { fill: black }

          div {
            color: white;
            font: 14px serif;
            height: 100%;
            overflow: auto;
          }
        </style>

        <polygon points="5,5 195,10 185,185 10,195" />

        <!-- Типичный пример использования: встраивание HTML-текста в SVG -->
        <foreignObject x="20" y="20" width="160" height="160">
        <!--
      В контексте SVG, внедрённого в HTML, пространство имён XHTML может и следует избегать,
      но это обязательно в контексте документа SVG
         -->
          <div xmlns="http://www.w3.org/1999/xhtml">
          - Смолчал хозяин, да и то, что мог сказать
          - Мне невдомёк, но во владениях чертога
          Поможет дом срубить да судьбы вам связать.
          Не веришь ежли - испроси у Бога...
          </div>
        </foreignObject>
      </svg>
    `;

    return 'data:image/svg+xml,' + encodeURIComponent(mySvg2);
  }

  initCanvasAndReturnViewport() {
    const app = new PixiApplication();

    this.document.body.appendChild(app.renderer.view);

    // viewport configuration
    const viewport = new Viewport({
      screenWidth: document.defaultView!.innerWidth,
      screenHeight: document.defaultView!.innerHeight,
      divWheel: app.renderer.view,
      interaction: app.renderer.plugins['interaction'],
      ticker: app.ticker,
    });
    viewport.sortableChildren = true;
    viewport.wheel().drag().clampZoom({
      minScale: 0.1,
      maxScale: 4,
    });
    app.stage.addChild(viewport);
    return viewport;
  }
}
