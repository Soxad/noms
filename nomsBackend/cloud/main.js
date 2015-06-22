// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("mark kicks ass at javascript");
});

//Incrementation

function increment(request,object,member) {
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