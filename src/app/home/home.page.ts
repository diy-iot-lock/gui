import { Component, ViewChild, ElementRef, OnInit, HostListener } from '@angular/core';
import { Plugins, CameraResultType, CameraSource } from '@capacitor/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DIYIoTlockApp } from '@diy-iot-lock/app';
import { Person } from '../shared/models/person';
import { Rectangle } from '../shared/models/rectangle';
import { Platform } from '@ionic/angular';
import { ConfigService } from '../shared/services/config-service';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  public photo: any;
  public app: any;
  public person: Person;
  public personId: string;
  public rectangle: Rectangle;
  public rectangles: Rectangle[] = [];
  public resizeRectangles: Rectangle[] = [];
  public nativeRectangles: Rectangle[] = [];
  public imgBlob: any;
  private ctx: CanvasRenderingContext2D;
  public status: string;
  public platformStatus: string;
  public width: number;
  public height: number;
  public resize: boolean;
  public candidates: any[] =[];
  public ratio: number;

  constructor(private sanitizer: DomSanitizer, public platform: Platform, public config: ConfigService) {
    this.app = new DIYIoTlockApp();
    if(this.platform.is('electron')) {
      this.platformStatus = './'
    }
    else {
      this.platformStatus = '../../'
    }
  }

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild('png', { static: true })
  png: ElementRef;
  @ViewChild('photo', { static: true })
  div: ElementRef;

  ngOnInit() {
    console.log(this.div.nativeElement.style.width)
    this.initApp();
    this.ctx  = this.canvas.nativeElement.getContext('2d');
    this.status = this.platformStatus + 'assets/img/ready.jpg';
    this.resize = false;
  }


  async takePicture() {
    this.status = this.platformStatus + 'assets/img/thinking.jpg';
    const image = await Plugins.Camera.getPhoto({
      quality: 100,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
    });
    this.photo = this.sanitizer.bypassSecurityTrustResourceUrl(image && (image.dataUrl));

    this.png.nativeElement.src = this.photo.changingThisBreaksApplicationSecurity;

    this.drawImg(this.png.nativeElement, this.ctx, this.canvas, this.width, this.height, this.div);
    this.status = this.platformStatus + 'assets/img/ready.jpg';
    this.rectangles = [];
    this.nativeRectangles =[];
    this.resizeRectangles = [];
    this.candidates = [];
  }

  
  createBlob(){
    this.status = this.platformStatus + 'assets/img/thinking.jpg';
    let regex = /^data:.+\/(.+);base64,(.*)$/;
    let matches = this.photo.changingThisBreaksApplicationSecurity.match(regex);
    let data = matches[2];
    this.imgBlob = this.dataURItoBlob(data);
  }

  drawImg(img, ctx, canvas, width, height, div) {
    img.onload = function() {
      width = img.width;
      height = img.height;
      this.ratio = img.width/div.nativeElement.offsetWidth;
      canvas.nativeElement.width = div.nativeElement.offsetWidth;
      canvas.nativeElement.height = img.height/this.ratio;
      ctx.drawImage(img,0,0,canvas.nativeElement.width,canvas.nativeElement.height);
    }
  }

  ngAfterViewChecked() {
    if(this.rectangles.length>0) {
      this.drawRect(this.rectangles);
    }
  }
 
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.resize = true;
    if(this.photo !== undefined) {
      this.width = event.target.innerWidth/1.75;
      this.height = event.target.innerHeight/1.75;
      var ratio = this.canvas.nativeElement.width / this.canvas.nativeElement.height;
          var canvas_height = this.height;
          var canvas_width = canvas_height * ratio;
          if(canvas_width>this.width){
              canvas_width=this.width;
              canvas_height=canvas_width/ratio;
          }
      
      var ratioImg = this.png.nativeElement.width / this.png.nativeElement.height;
          var img_height = this.height;
          var img_width = img_height * ratioImg;
          if(img_width>this.width){
              img_width=this.width;
              img_height=img_width/ratioImg;
          }

      this.canvas.nativeElement.width = canvas_width;
      this.canvas.nativeElement.height = canvas_height;
      this.png.nativeElement.src = this.photo.changingThisBreaksApplicationSecurity;
      this.png.nativeElement.width = img_width;
      this.png.nativeElement.height = img_height;
    }
  }

  drawRect(rectangles){  
    let ratioRectWidth = this.png.nativeElement.naturalWidth / this.canvas.nativeElement.width;
    let ratioRectHidth = this.png.nativeElement.naturalHeight / this.canvas.nativeElement.height;
    rectangles.forEach((i, index) => {
      this.ctx.strokeStyle = "red";
      this.ctx.strokeRect(i.left/ratioRectWidth, i.top/ratioRectHidth, i.width/ratioRectWidth, i.height/ratioRectHidth);
      this.ctx.font = "40px Arial";
      this.ctx.fillStyle = "red";
      this.ctx.fillText(`${index+1}`, i.left/ratioRectWidth-25, i.top/ratioRectHidth+30);
    })
  }

  dataURItoBlob(dataURI) {
    this.status = this.platformStatus + 'assets/img/thinking.jpg';
    const byteString = window.atob(dataURI);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([int8Array], { type: 'image/png' }); 
    return blob;
  }

  async initApp() {
    
    const faceUrl = this.config.faceUrl;
    const faceKey = this.config.faceKey;
    this.app.setFaceConfig(faceUrl, faceKey);

    const blobName = this.config.blobName;
    const blobSAS  = this.config.blobSAS;
    this.app.setBlobConfigSAS(blobName, blobSAS);

    await this.app.initializeAsync();
  }

  async detectFaces() {
    this.rectangles = [];
    this.resizeRectangles = [];
    this.candidates = [];
    this.status = this.platformStatus + 'assets/img/thinking.jpg';
    this.createBlob();
    await this.app.predict.detectFacesAsync(this.imgBlob)
    .then(res => {
      console.log(res); 
      this.nativeRectangles = res.map(r => r.faceRectangle);
      this.rectangles = res.map(r => r.faceRectangle);
      if(this.resize) {
        this.rectangles.forEach((i, index) => {
          let resizeRectangle = new Rectangle();
          let ratioRectWidth = this.png.nativeElement.naturalWidth / this.png.nativeElement.width;
          let ratioRectHidth = this.png.nativeElement.naturalHeight / this.png.nativeElement.height;
          resizeRectangle.width = i.width/ratioRectWidth;
          resizeRectangle.height = i.height/ratioRectHidth;
          resizeRectangle.left = i.left/ratioRectWidth;
          resizeRectangle.top = i.top/ratioRectHidth;
          this.resizeRectangles.push(resizeRectangle);
        })
        this.rectangles = this.resizeRectangles;
        this.drawRect(this.rectangles);
      }
      else {
        this.drawRect(this.rectangles);
      }
    })
    .catch(error => console.log("ERROR", error))
    this.status = this.platformStatus + 'assets/img/ready.jpg';
  }
  
  async setImageAsMaster(rectangle, index) {
    this.status = this.platformStatus + 'assets/img/thinking.jpg';
    this.createBlob();
    this.person = new Person();
    this.person.name = `Alex- ${index}`;
    await this.app.train.addPersonAsync(this.person)
    .then(res => {
      this.personId = res.personId;
      console.log(res);
    })
      
    await this.app.train.addPersonFaceAsync(this.personId, this.imgBlob, rectangle)
      .then(() => {
        console.log("Person face added");
      })
      .catch(err => console.log("ERRRRR", err))
    
    this.status = this.platformStatus + 'assets/img/ready.jpg';
  }

  async tryToUnlock() {
    this.rectangles = [];
    this.resizeRectangles = [];
    this.status = this.platformStatus + 'assets/img/thinking.jpg';
    this.createBlob();
    await this.app.predict.identifyFacesAsync(this.imgBlob)
    .then(res => {
      console.log(res);
      this.candidates = res.map(r => {
        if(r.candidates.length<=0) {
          return 0;
        }
        else{
          return r.candidates[0].confidence;
        }
      });
      this.rectangles = res.map(r => r.faceRectangle);
      if(res.length <= 0) {
        this.status = this.platformStatus + 'assets/img/fail.jpg';
      }
      else {
        
        let success = this.candidates.find(i => i*100 >= 70)
        if(success == undefined) {
          this.status = this.platformStatus + 'assets/img/fail.jpg';
        }
        else {
          this.status = this.platformStatus + 'assets/img/success.jpg';
        }
          if(this.resize) {
            this.rectangles.forEach((i, index) => {
              let resizeRectangle = new Rectangle();
              let ratioRectWidth = this.png.nativeElement.naturalWidth / this.png.nativeElement.width;
              let ratioRectHidth = this.png.nativeElement.naturalHeight / this.png.nativeElement.height;
              resizeRectangle.width = i.width/ratioRectWidth;
              resizeRectangle.height = i.height/ratioRectHidth;
              resizeRectangle.left = i.left/ratioRectWidth;
              resizeRectangle.top = i.top/ratioRectHidth;
              this.resizeRectangles.push(resizeRectangle);
            })
            this.rectangles = this.resizeRectangles;
            this.drawRect(this.rectangles);
          }
          else {
            this.drawRect(this.rectangles);
          }
      }
    })
    .catch(error => console.log(error))
  }

}
