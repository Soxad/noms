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
			success: function(object) {
				object.increment(member);
				object.save();
			},
			error: function(error) {
				console.error(Error on comment save, error.code + " : " + error.message);
			}
		});
	}
}

Parse.Cloud.afterSave("Comment", increment(request,"nom","commentCount"));

Parse.Cloud.afterSave("nom", increment(request,Parse.User,"nomCount"));

//nom likes will have to be incremented from the front end

Parse.Cloud.define("follow", function(request) {
	var follower = request.User;
	var followee = request.params.User;
	
	var toRelation = follower.relation("following");
	var fromRelation = followee.relation("followedBy");
	
	toRelation.add(followee);
	fromRelation.add(follower);

	followee.increment("followingCount");
	follower.increment("followerCount");
}

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
Parse.Cloud.beforeSave("Deal", checkInvalidString(request,response,"dealString"));
Parse.Cloud.beforeSave("nom", checkInvalidString(request,response,"Title"));
Parse.Cloud.beforeSave("nom", checkInvalidString(request,response,"Description"));
Parse.Cloud.beforeSave("Restaurant", checkInvalidString(request,response,"Name"));