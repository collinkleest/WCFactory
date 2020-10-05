import{LitElement,html}from"../../node_modules/lit-element/lit-element.js";customElements.define("hax-status",class HaxStatus extends LitElement{static get properties(){return{status:{type:String},_clock:{type:String}}}constructor(){super(),this.status="loading";let clock=1;setInterval(()=>{1===clock&&(this._clock="🕛"),2===clock&&(this._clock="🕒"),3===clock&&(this._clock="🕕"),4===clock&&(this._clock="🕘"),clock=4===clock?1:++clock,console.log(clock)},500),fetch("https://haxtheweb.org").then(res=>{200===res.status?this.status="up":this.status="down"}).catch(()=>{this.status="down"})}render(){return html`
      ${"loading"===this.status?html`${this._clock}`:""}
      ${"up"===this.status?html`HAXtheWeb.org is up! 😁`:""}
      ${"down"===this.status?html`HAXtheWeb.org is down 😦`:""}
    `}});