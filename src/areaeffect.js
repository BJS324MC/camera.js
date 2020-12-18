class AreaEffect{
    constructor(options){
        let {x,y,width=0,height=0,radius=0,onCollide,onUncollide,customCollision}=options;
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
