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
        this.tracking=obj;
        if(sec)return this.transition(0,p,sec,[this.x,this.y],()=>[obj.x,obj.y],(a,l,t)=>{if(t)this.isTracking=true;this.x=this.lockX ? this.x:a[0];this.y=this.lockY ? this.y:a[1]});
        this.x=obj.x;this.y=obj.y;this.isTracking=true;
    }
    stopTracking(){
        this.isTracking=false;
        this.tracking={x:this.x,y:this.y};
    }
    transition(id,pp=this.easing,sec,a,b,f){
        let p;
        if(Array.isArray(pp)){
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
