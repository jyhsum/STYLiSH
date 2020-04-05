app.init=function(){
	app.cart.init();
	app.fb.loginMessageBtn();
	app.fb.statusChangeCallback=app.initProfile;
};
app.initProfile=function(){
	if(app.state.auth===null && window.location.href.indexOf('profile.1.html') > 0){
		window.location="./";
	}
	if(window.location.href.indexOf('profile.1.html') > 0){
		app.fb.logoutBtn();
		app.orderInfoStatusBtn();
	}
	app.fb.getProfile().then(function(data){
		app.showProfile(data);
	}).catch(function(error){
		console.log("Facebook Error", error);
	});
};
app.showProfile=function(data){
	app.get(".profile-photo").style.backgroundImage=`url(https://graph.facebook.com/${data.id}/picture/?width=200)`;
	app.get(".profile-name").innerHTML=`<i class="fas fa-user"></i>${data.name}`;
	app.get(".profile-grade").innerHTML=`<i class="fas fa-medal"></i>目前積分 : 878`
};
app.orderInfoStatusBtn=function(){
	let orderStatus=app.getAll(".oderInfo-title");
	orderStatus.forEach(itme => {
		app.setEventHandlers(itme, {
			click:app.changeOrderInfo
		});
	});
}
app.changeOrderInfo=function(e){
	let orderStatus=app.getAll(".oderInfo-title");
	orderStatus.forEach(item => {
		item.classList.remove('active');
	})
	e.target.classList.add('active');
	let oderInfoContent=app.get('.oderInfo-content');
	oderInfoContent.innerHTML='';
	let index;
	switch(e.target.dataset.index){
		case '0':
		index = 0;
		app.showUserOrderInfo(index);
			break;
		case '1':
		index = 1;
		app.showUserOrderInfo(index);
			break;
		default:
		index = 2;
		app.showUserOrderInfo(index);
	}
}
window.addEventListener("DOMContentLoaded", app.init);