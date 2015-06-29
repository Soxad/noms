// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("mark kicks ass at javascript");
});

// get feed photos (noms) [basic spitter]
// spit out the whole nom
// profile photo spitter: takes user,index
Parse.Cloud.define("spitProfilePhoto", function(request,response,user) {
	var index = request.params.index;
	var user = request.params.user;
	var nomTarget;
	
	nom = Parse.object.extend("nom");
	query = new Parse.query(nom);
	
	query.equalTo("author",user);
	query.skip(index);
	
	query.first({
		success: function(theNom) {
			nomTarget = theNom;
		}
	});
	return nomTarget;
}

// get profile photos [basic spitter]

// Feed photo spitter: takes index
Parse.Cloud.define("spitFeedPhoto", function(request) {
	var index = request.params.index;
	var nomTarget;
	nom = Parse.object.extend("nom");
	query = new Parse.query(nom);
	query.descending("createdAt");
	query.skip(index);
	
	query.first({
		success: function(theNom) {
			nomTarget = theNom;
		}
	});
	return nomTarget;
}

// TODO: complete deal generation

Parse.Cloud.define("getRandomDeal", function(request) {
	var dealTarget;
	deal = Parse.object.extend("deal");
	
	dealCount = deal.count();
	
	randomDeal = Math.floor((Match.random() * dealCount) +1);
	
	query = new Parse.query(deal);
	query.skip(randomDeal);
	query.first({
		success: function(theDeal){
			dealTarget = theDeal;
		}
	});
	return dealTarget;
}

//Incrementation

function increment(request,response,object,member) {
	return function(request) {
		query = new Parse.Query(object);
		query.get(request.object.get(object).id, {
			success: function(obj) {
				obj.increment(member);
				obj.save();
			},
			error: function(error) {
				console.error(Error on comment save, error.code + " : " + error.message);
			}
		});
	}
}

Parse.Cloud.afterSave("Comment", increment(request,"nom","commentCount"));

Parse.Cloud.afterSave("nom", increment(request,"publicUser","nomCount"));

//nom likes will have to be incremented from the front end

Parse.Cloud.define("follow", function(request) {
	var follower = request.User.get("is");
	var followee = request.params.User.get("is");
	
	var toRelation = follower.relation("following");
	var fromRelation = followee.relation("followedBy");
	
	toRelation.add(followee);
	fromRelation.add(follower);

	followee.increment("followingCount");
	follower.increment("followerCount");
});



//Validation

var check = /[ A-Za-z0-9_@.,/#&+()^:;!?+'"-]/;
function checkInvalidString(request,response,member) {
	return function(request,response) {
		if (check.test(request.object.get(member))) {
			response.error("Your comment contains illegal characters.");
		} else {
			response.success();
		}
	}
}

Parse.Cloud.beforeSave("Comment", checkInvalidString(request,response,"text"));
Parse.Cloud.beforeSave(Parse.User,checkInvalidString(request,response,"username"));
Parse.Cloud.beforeSave("publicUser",checkInvalidString(request,response,"username"));
Parse.Cloud.beforeSave("Deal", checkInvalidString(request,response,"dealString"));
Parse.Cloud.beforeSave("nom", checkInvalidString(request,response,"Title"));
Parse.Cloud.beforeSave("nom", checkInvalidString(request,response,"Description"));
Parse.Cloud.beforeSave("Restaurant", checkInvalidString(request,response,"Name"));

// Public user creation

Parse.Cloud.beforeSave(Parse.User, function(request, response) {
	var publicUser = Parse.Object.extend("publicUser");
	publicUser.set("username",request.user.get("username"));
	publicUser.set("is", request.user);
	publicUser.save(null,null,null);
});

//Anti Spam
// Do not create a new object if the user created an object of the same class within the time (seconds)
function spamProtection (request, response, object, time, message) {
	return function(request, response) {
		var checkDate;
		var targetObj = Parse.extend(object);
		var query = Parse.Query(targetObj);
		query.equalTo("createdBy",request.user);
		
		query.descending("createdAt");
		query.select("createdAt");	
		query.first({
			success: function(obj) {
				checkDate = obj.get("createdAt");
				jsDate = new Date(checkDate);
				now = new Date();
				
				if((now-jsDate) < (time * 1000)) {  //if the user is spamming
					response.error(message);
				} else {
					response.success();
				}
				
			},
			error: function(error) {
				response.success();  //The user has not created such an object yet, we dont need to check for spam
			});
		}
	}
}

Parse.Cloud.beforeSave("nom",spamProtection(request,response,"nom",60,"Sorry, you need to wait 60 seconds between making new noms."));
Parse.Cloud.beforeSave("comment",spamProtection(request,response,"comment",20,"Sorry, you are posting comments too fast."));

//Temporary Moderation utilities

function findUser(username) {
	var user;
	var publicUser = Parse.Object.extend("publicUser");	
	var userQuery = Parse.Query(publicUser);
	userQuery.equalTo("username",username);
	userQuery.first({
		success: function(theUser) {
			user = theUser;
		}
	});
	return user;
}

Parse.Cloud.define("deleteComment",function(request,response,user,commentText){
	var offendingUser = findUser(user);
	var offendingComment;
	
	var comment = Parse.Object.extend("comment");
	var query = Parse.Query(comment);
	query.equalTo("author",offendingUser);
	query.startsWith("text",commentText);
		
	query.first({
		success: function(theComment) {
			offendingComment = theComment;
		}
	});
	
	offendingComment.destroy({});
});

Parse.Cloud.define("deleteNom",function(request,response,user,nomTitle){
	var offendingUser = findUser(user);
	var offendingNom;
	
	var nom = Parse.Object.extend("nom");
	var query = Parse.Query(nom);
	query.equalTo("createdBy",offendingUser);
	query.startsWith("title",nomTitle);
		
	query.first({
		success: function(theNom) {
			offendingNom = theNom;
		}
	});
	
	offendingNom.destroy({});
});

