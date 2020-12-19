class Collider{
    constructor(options){
        let {x=0,y=0,width=0,height=0,radius=0,onCollide,onUncollide,customCollision}=options;
        this.x=x;
        this.y=y;
        this.width=width;
        this.height=height;
        this.r=radius;
        this.collided=false;
        this.onCollide=onCollide;
        this.onUncollide=onUncollide;
        this.customCollision=customCollision;
    }
    rrCollision(obj){
        return obj.x>this.x && obj.y>this.y && obj.x<this.x+this.width && obj.y<this.y+this.height
    }
    ccCollision(obj){
        return Math.hypot(obj.x-this.x,obj.y-this.y)<obj.r+this.r
    }
    rcCollision(obj){
        let tx=obj.x<this.x?this.x:obj.x>this.x+this.width?this.x+this.width:obj.x,
            ty=obj.y<this.y?this.y:obj.y>this.y+this.height?this.y+this.height:obj.y;
        return Math.hypot(obj.x-tx,obj.y-ty)<obj.r
    }
    crCollision(obj){
        let tx=this.x<obj.x?obj.x:this.x>obj.x+obj.width?obj.x+obj.width:this.x,
            ty=this.y<obj.y?obj.y:this.y>obj.y+obj.height?obj.y+obj.height:this.y;
        return Math.hypot(this.x-tx,this.y-ty)<this.r
    }
    checkCollision(obj){
        if(this.customCollision){
            return this.customCollision(this,obj);
        }else if(this.width && this.height){
            if(obj.r){
                return this.rcCollision(obj);
            }else{
                return this.rrCollision(obj);
            }
        }else if(this.r){
            if(obj.r){
                return this.ccCollision(obj);
            }else{
                return this.crCollision(obj);
            }
        }
    }
    update(obj){
        let collided=this.checkCollision(obj);
        if(!this.collided && collided){
            this.onCollide();
            this.collided=true;
        }else if(this.collided && !collided){
            this.onUncollide();
            this.collided=false;
        }
    }
}
class Transition{
    constructor(defaultEasing,a,b,f,sec){
        this.p=defaultEasing;
        this.last=0;
        this.op={
            a:a,
            b:b,
            f:f,
            sec:sec
        };
        this.ended=false;
        this.onEnd=function(){this.last=1};
    }
    _bezier(t,p){
        if(p.length===1)return p[0];
        let b=[];
        for(let i=0;i<p.length-1;i++)b.push([(p[i+1][0]-p[i][0])*t+p[i][0],(p[i+1][1]-p[i][1])*t+p[i][1]]);
        return this._bezier(t,b);
    }
    update(d){
        if(this.ended)return false;
        let {a,b,f,sec}=this.op;
        this.last+=d/sec;if(this.last>1)this.last=1;
        if(this.last>=1){this.ended=true;this.onEnd()};
        f(typeof this.p==="function"?this.p(a,b,this.last):Array.isArray(this.p)?(typeof b==="function" ? b():b).map((c,i)=>(c-a[i])*this._bezier(this.last,this.p)[1]+a[i]):false,this.last,this.ended);
    }
}
class Camera{
    constructor(width,height,angle=0,easing=[]){
        this.width=width;
        this.height=height;
        this.rotation=angle;
        this.easing=easing;
        this.x=0;
        this.y=0;
        this.tracking={x:0,y:0};
        this.isTracking=false;
        this.lockX=false;
        this.lockY=false;
        this.offSetX=0;
        this.offSetY=0;
        this.zoomFactor=1;
        this.trackingSpeed=1;
        this.transitions={};
        this.easingNames={
            "linear":[],
            "ease":[[0.25,0.1],[0.25,1]],
            "ease-in":[[0.37,0],[0.67,0]],
            "ease-out":[[0.33,1],[0.68,1]],
            "ease-in-out":[[0.65,0],[0.35,1]],
            "ease-in-back":[[0.36,0],[0.66,-0.56]],
            "ease-out-back":[[0.34,1.56],[0.64,1]],
            "ease-in-out-back":[[0.68,-0.6],[0.32,1.6]]
        };
    }
    move(x,y,sec,p){
        if(sec)return this.transition(4,p,sec,[this.x,this.y],[(this.lockX && this.isTracking)?this.x:x,(this.lockY && this.isTracking)?this.y:y],a=>{this.x=a[0];this.y=a[1]});
        this.x=x;this.y=y;
    }
    rotate(n,sec,p){
        if(sec)return this.transition(3,p,sec,[this.rotation],[n],a=>this.rotation=a[0]);
        this.rotation=n;
    }
    startTracking(obj,sec,p){
        this.tracking=obj;let tks=this.trackingSpeed;
        if(sec){
            this.trackingSpeed=0;
            let t=this.transition(0,p,sec,[this.x,this.y],()=>[obj.x,obj.y],(a,l,t)=>{if(t)this.isTracking=true;this.x=this.lockX ? this.x:a[0];this.y=this.lockY ? this.y:a[1]});
            setTimeout(()=>this.trackingSpeed=tks,1);
            return t;
        }
        this.x=obj.x;this.y=obj.y;this.isTracking=true;
    }
    stopTracking(){
        this.isTracking=false;
        this.tracking={x:this.x,y:this.y};
    }
    transition(id,pp=this.easing,sec,a,b,f){
        let p;
        if(typeof pp==="string")p=this.easingNames[pp];
        else if(Array.isArray(pp)){
            p=pp.map(a=>[a[0]>1 ? 1:a[0]<0 ? 0:a[0],a[1]]);
            p.unshift([0,0]);p.push([1,1]);
        }else p=pp;
        this.transitions[id]=new Transition(p,a,b,f,sec);
        this.transitions[id].onEnd=()=>delete this.transitions[id];
        return this.transitions[id];
    }
    offSet(x,y,sec,p){
        if(sec)return this.transition(1,p,sec,[this.offSetX,this.offSetY],[-x,y],a=>{this.offSetX=a[0];this.offSetY=a[1]});
        this.offSetX=-x;this.offSetY=y;
    }
    zoom(n,sec,p){
        if(sec)return this.transition(2,p,sec,[this.zoomFactor],[n],a=>this.zoomFactor=a[0]);
        this.zoomFactor=n;
    }
    shake(amp){
        this.offSetX=Math.random()*amp;
        this.offSetY=Math.random()*amp;
    }
    render(ctx,draw,clear=false,m=0,y=0,deltaTime=0){
        let lerp=(a,b,t)=>(1-(t=t>1?1:t))*a+t*b;
        deltaTime=(m-y)*0.001;
        if(clear)ctx.clearRect(0,0,innerWidth,innerHeight);
        if(this.isTracking){if(!this.lockX)this.x=lerp(this.x,this.tracking.x,deltaTime*this.trackingSpeed);if(!this.lockY)this.y=lerp(this.y,this.tracking.y,deltaTime*this.trackingSpeed)};
        ctx.save();
        ctx.translate(this.width/2,this.height/2)
        ctx.rotate(this.rotation*Math.PI/180);
        ctx.translate(-this.width/2,-this.height/2);
        ctx.translate((this.width/(2*this.zoomFactor)-this.x+this.offSetX)*this.zoomFactor,(this.height/(2*this.zoomFactor)-this.y+this.offSetY)*this.zoomFactor);
        ctx.scale(this.zoomFactor,this.zoomFactor);
        draw();
        ctx.restore();
        for(let q in this.transitions){
            let res=this.transitions[q];
            res.update(deltaTime);
        }
        requestAnimationFrame(h=>this.render(ctx,draw,clear,h,m,deltaTime));
    }
}
