// initialize app structure
let app={
	fb:{},
	state:{
		cart:null, auth:null, user:{}
	}, evts:{}, cart:{},
	cst:{
		API_HOST:"https://jyhsum.com/api/1.0" //https://jyhsum.com/api/1.0/order/check_order https://api.appworks-school.tw/api/1.0
	}
};
// core operations
app.get=function(selector){
	return document.querySelector(selector);
};
app.getAll=function(selector){
	return document.querySelectorAll(selector);
};
app.createElement=function(tagName,settings,parentElement){
	let obj=document.createElement(tagName);
	if(settings.atrs){app.setAttributes(obj,settings.atrs);}
	if(settings.stys){app.setStyles(obj,settings.stys);}
	if(settings.evts){app.setEventHandlers(obj,settings.evts);}
	if(parentElement instanceof Element){parentElement.appendChild(obj);}
	return obj;
};
app.modifyElement=function(obj,settings,parentElement){
	if(settings.atrs){
		app.setAttributes(obj,settings.atrs);
	}
	if(settings.stys){
		app.setStyles(obj,settings.stys);
	}
	if(settings.evts){
		app.setEventHandlers(obj,settings.evts);
	}
	if(parentElement instanceof Element&&parentElement!==obj.parentNode){
		parentElement.appendChild(obj);
	}
	return obj;
};
app.setStyles=function(obj,styles){
	for(let name in styles){
		obj.style[name]=styles[name];
	}
	return obj;
};
app.setAttributes=function(obj,attributes){
	for(let name in attributes){
		obj[name]=attributes[name];
	}
	return obj;
};
app.setEventHandlers=function(obj,eventHandlers,useCapture){
	for(let name in eventHandlers){
		if(eventHandlers[name] instanceof Array){
			for(let i=0;i<eventHandlers[name].length;i++){
				obj.addEventListener(name,eventHandlers[name][i],useCapture);
			}
		}else{
			obj.addEventListener(name,eventHandlers[name],useCapture);
		}
	}
	return obj;
};
app.ajax=function(method, src, args, headers, callback){
	let req=new XMLHttpRequest();
	if(method.toLowerCase()==="post"){ // post through json args
		req.open(method, src);
		req.setRequestHeader("Content-Type", "application/json");
		app.setRequestHeaders(req, headers);
		req.onload=function(){
			callback(this);
		};
		req.send(JSON.stringify(args));
	}else{ // get through http args
		req.open(method, src+"?"+args);
		app.setRequestHeaders(req, headers);
		req.onload=function(){
			callback(this);
		};
		req.send();
	}
};
	app.setRequestHeaders=function(req, headers){
		for(let key in headers){
			req.setRequestHeader(key, headers[key]);
		}
	};
app.getParameter=function(name){
	let result=null, tmp=[];
	window.location.search.substring(1).split("&").forEach(function(item){
		tmp=item.split("=");
		if(tmp[0]===name){
			result=decodeURIComponent(tmp[1]);
		}
	});
	return result;
};
// menu items
app.updateMenuItems=function(tag){
	let desktopItems=app.getAll("header>nav>.item");
	let mobileItems=app.getAll("nav.mobile>.item");
	if(tag==="women"){
		desktopItems[0].classList.add("current");
		mobileItems[0].classList.add("current");
	}else if(tag==="men"){
		desktopItems[1].classList.add("current");
		mobileItems[1].classList.add("current");
	}else if(tag==="accessories"){
		desktopItems[2].classList.add("current");
		mobileItems[2].classList.add("current");
	}
};
// loading
app.showLoading=function(){
	app.get("#loading").style.display="block";
};
app.closeLoading=function(){
	app.get("#loading").style.display="none";
};
// facebook login
app.fb.load=function(){
	// Load the SDK asynchronously
	(function(d, s, id){
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) return;
		js = d.createElement(s); js.id = id;
		js.src = "https://connect.facebook.net/zh_TW/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, "script", "facebook-jssdk"));
};
app.fb.init=function(){
	const BetaFBNum = '1255228684626335';
	FB.init({
		appId: BetaFBNum,
		cookie:true, xfbml:true,
		version:"v3.2"
	});
	FB.getLoginStatus(function(response){
		app.fb.loginStatusChange(response);
		// set member click handlers
		let memberIcons=app.getAll(".member");
		for(let i=0;i<memberIcons.length;i++){
			app.setEventHandlers(memberIcons[i], {
				click:app.fb.clickProfile
			});
		}
	});
};
app.fb.login=function(){
	FB.login(function(response){
		app.fb.loginStatusChange(response);
	}, {scope:"public_profile,email"});
};
app.fb.loginStatusChange=function(response){
	console.log(response.status);
	if(response.status==="connected"){
		app.state.auth=response.authResponse;
		app.fb.updateLoginToServer();
		if(window.location.href.indexOf('login.html') > 0){
			if(document.referrer.indexOf('cart.html') > 0){
				window.location="./cart.html"
			} else {
				window.location="./profile.1.html"
			}
		}
	}else{
		app.state.auth=null;
	}
	if(typeof app.fb.statusChangeCallback==="function"){
		app.fb.statusChangeCallback();
	}
	if(window.location.href.indexOf('cart.html') > 0){
		app.fb.clickCart();  //
		app.fb.loginMessageBtn();
	}
};
app.fb.changePhoto=function(photo){
	let memberImage=app.get('.loginPhoto');
	memberImage.src=photo
}
app.fb.updateLoginToServer=function(){
	let data={
		provider:"facebook",
		access_token:app.state.auth.accessToken
	}
	console.log(app.state.auth.accessToken)
	app.ajax("post", app.cst.API_HOST+"/user/signin", data, {}, function(req){
		let data = (JSON.parse(req.responseText)).data
		// console.log(JSON.parse(req.responseText));
		let photo = data.user.picture;
		app.state.user.user_id = data.user.id;

		app.fb.changePhoto(photo);
		app.getUserOrderInfo();
	});
};
app.getUserOrderInfo=function(){
	let headers={};
	headers["Authorization"]="Bearer "+app.state.auth.accessToken; //FB的token
	app.ajax("get", app.cst.API_HOST+"/order/check_order", {}, headers, function(req){
		let data = (JSON.parse(req.response)).data;
		const userOrderInfo = data.filter(function(item, index, array){
			return item.user_id === app.state.user.user_id;
		});
		app.state.user.orderInfo = userOrderInfo;
		app.showUserOrderInfo();
	});
}
app.showUserOrderInfo=function(index=0){
	console.log(index);
	let orderInfoBtn =  app.getAll('.oderInfo-title');
	if(orderInfoBtn.length && app.state.user.orderInfo){
		(app.state.user.orderInfo).forEach(item => {
			let { number, time, details, order_status } = item;
			let detailsObj = JSON.parse(details)
			switch(index){
				case 0:
					app.showUserOrderStatus_0(number, time, details, order_status, detailsObj);
				break;
				case 1:
					app.showUserOrderStatus_1(number, time, details, order_status, detailsObj);
				break;
				default:
					app.showUserOrderStatus_2(number, time, details, order_status, detailsObj);
			}
		})
	}
}
app.showUserOrderStatus_0=function(number, time, details, order_status, detailsObj){
	let orderDate = new Date(time);
	let year = orderDate.getFullYear();
	let month = orderDate.getMonth() + 1;
	let data = orderDate.getDate();

	if(order_status === 0) {
		let oderInfoContent=app.get('.oderInfo-content');
		let oderInfoItem = app.createElement("ul", {atrs:{
			className:"oderInfo-item h-flex h-flex-wrap h-justify-content-between h-flex-column h-flex-lg-row",
		}}, oderInfoContent);
		app.createElement("li", {atrs:{
			className:"oderInfo-idNumber",
			textContent: `訂單編號: ${number}`
		}}, oderInfoItem); 
		app.createElement("li", {atrs:{
			className:"oderInfo-date",
			textContent: `訂單日期: ${year}-${month}-${data}`
		}}, oderInfoItem);
		app.createElement("li", {atrs:{
			className:"oderInfo-totalPrice",
			textContent: `訂單總額: NT. ${detailsObj.total}`
		}}, oderInfoItem);
		app.createElement("li", {atrs:{
			className:"oderInfo-status",
			textContent: "訂單狀態: 處理中"
		}}, oderInfoItem);
		let productList=app.createElement("li", {atrs:{
			className:"oderInfo-productList",
		}}, oderInfoItem);
		app.createElement("a", {atrs:{
			textContent: "訂單項目明細",
			href: "#"
		}}, productList);
	}
}
app.showUserOrderStatus_1=function(number, time, details, order_status, detailsObj){
	let orderDate = new Date(time);
	let year = orderDate.getFullYear();
	let month = orderDate.getMonth() + 1;
	let data = orderDate.getDate();

	if(order_status === 1) {
		let oderInfoContent=app.get('.oderInfo-content');
		let oderInfoItem = app.createElement("ul", {atrs:{
			className:"oderInfo-item h-flex h-flex-wrap h-justify-content-between h-flex-column h-flex-lg-row",
		}}, oderInfoContent);
		app.createElement("li", {atrs:{
			className:"oderInfo-idNumber",
			textContent: `訂單編號: ${number}`
		}}, oderInfoItem); 
		app.createElement("li", {atrs:{
			className:"oderInfo-date",
			textContent: `訂單日期: ${year}-${month}-${data}`
		}}, oderInfoItem);
		app.createElement("li", {atrs:{
			className:"oderInfo-totalPrice",
			textContent: `訂單總額: NT. ${detailsObj.total}`
		}}, oderInfoItem);
		let receiveStatus=app.createElement("li", {atrs:{
			className:"oderInfo-receiveStatus",
		}}, oderInfoItem);
		app.createElement("a", {atrs:{
			textContent: "確認已收到貨",
			href: "#"
		}}, receiveStatus);
		let productList=app.createElement("li", {atrs:{
			className:"oderInfo-productList",
		}}, oderInfoItem);
		app.createElement("a", {atrs:{
			textContent: "訂單項目明細",
			href: "#"
		}}, productList);
	}
}
app.showUserOrderStatus_2=function(number, time, details, order_status, detailsObj){
	let orderDate = new Date(time);
	let year = orderDate.getFullYear();
	let month = orderDate.getMonth() + 1;
	let data = orderDate.getDate();

	if(order_status === 2) {
		let oderInfoContent=app.get('.oderInfo-content');
		let oderInfoItem = app.createElement("ul", {atrs:{
			className:"oderInfo-item h-flex h-flex-wrap h-justify-content-between h-flex-column h-flex-lg-row",
		}}, oderInfoContent);
		app.createElement("li", {atrs:{
			className:"oderInfo-idNumber",
			textContent: `訂單編號: ${number}`
		}}, oderInfoItem); 
		app.createElement("li", {atrs:{
			className:"oderInfo-date",
			textContent: `訂單日期: ${year}-${month}-${data}`
		}}, oderInfoItem);
		app.createElement("li", {atrs:{
			className:"oderInfo-totalPrice",
			textContent: `訂單總額: NT. ${detailsObj.total}`
		}}, oderInfoItem);
		app.createElement("li", {atrs:{
			className:"oderInfo-status",
			textContent: "訂單狀態: 已完成"
		}}, oderInfoItem);
		let productList=app.createElement("li", {atrs:{
			className:"oderInfo-productList",
		}}, oderInfoItem);
		app.createElement("a", {atrs:{
			textContent: "訂單項目明細",
			href: "#"
		}}, productList);
	}
}
app.fb.clickProfile=function(){
	if(app.state.auth===null){
		window.location="./login.html";
	}else{
		window.location="./profile.1.html";
	}
};
app.fb.clickCart=function(){
	if(app.state.auth===null){
		console.log('沒登入唷');
		window.location="./login.html";
	}else{
		console.log('有登入唷');
		
	}
};
app.fb.loginMessageBtn=function(){
	if(window.location.href.indexOf('login.html') > 0) {
		let loginMessageBtn=app.get(".loginMessageBtn");
		app.setEventHandlers(loginMessageBtn, {
			click:app.fb.login
		});
	}
}
app.fb.logoutBtn=function(){
	let logoutBtn=app.get(".profile-log-out");
	// console.log(logoutBtn)
	app.setEventHandlers(logoutBtn, {
		click:app.fb.logout
	});
}
app.fb.logout=function(){
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			FB.api(`/me/permissions`, "DELETE", function(res) {
				console.log(res);
			})
			FB.logout(function() {
				window.location="./";
			});
		}
	});
}
app.fb.getProfile=function(){
	return new Promise((resolve, reject)=>{
		FB.api("/me?fields=id,name,email", function(response){
			if(response.error){
				reject(response.error);
			}else{
				resolve(response);
			}
		});
	});
};
window.fbAsyncInit=app.fb.init;
window.addEventListener("DOMContentLoaded", app.fb.load);
// shopping cart
app.cart.init=function(){
	let storage=window.localStorage;
	let cart=storage.getItem("cart");
	if(cart===null){
		cart={
			shipping:"delivery", payment:"credit_card",
			recipient:{
				name:"", phone:"", email:"", address:"", time:"anytime"
			},
			list:[],
			subtotal:0,
			freight:60,
			total:0
		};
	}else{
		try{
			cart=JSON.parse(cart);
		}catch(e){
			storage.removeItem("cart");
			app.cart.init();
			return;
		}
	}
	app.state.cart=cart;
	// refresh UIs
	app.cart.show();
};
app.cart.update=function(){
	let storage=window.localStorage;
	let cart=app.state.cart;
	let subtotal=0;
	for(let i=0;i<cart.list.length;i++){
		subtotal+=cart.list[i].price*cart.list[i].qty;
	}
	cart.subtotal=subtotal;
	cart.total=cart.subtotal+cart.freight;
	// save to storage
	storage.setItem("cart", JSON.stringify(cart));
	// refresh UIs
	app.cart.show();
};
app.cart.show=function(){
	let cart=app.state.cart;
	app.get("#cart-qty-mobile").textContent=app.get("#cart-qty").textContent=cart.list.length;
};
app.cart.add=function(product, variant, qty){
	let list=app.state.cart.list;
	let color=product.colors.find((item)=>{
		return item.code===variant.color_code;
	});
	let item=list.find((item)=>{
		return item.id===product.id&&item.size===variant.size&&item.color.code===color.code;
	});
	if(item){
		item.qty=qty;
	}else{
		list.push({
			id:product.id,
			title:product.title,
			price:product.price,
			main_image:product.main_image,
			size:variant.size,
			color:color,
			qty:qty, stock:variant.stock
		});
	}
	app.cart.update();
	alert("已加入購物車");
};
app.cart.remove=function(index){
	let list=app.state.cart.list;
	list.splice(index, 1);
	app.cart.update();
	alert("已從購物車中移除");
};
app.cart.change=function(index, qty){
	let list=app.state.cart.list;
	list[index].qty=qty;
	app.cart.update();
};
app.cart.clear=function(){
	let storage=window.localStorage;
	storage.removeItem("cart");
};