from flask import Flask, render_template, url_for
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from enum import Enum
import sys
from map.main import main
from flask_jsglue import JSGlue


app = Flask(__name__)
app.register_blueprint(main, url_prefix="/map")
api = Api(app)
jsglue = JSGlue(app)

app.secret_key = "Moshe_Nahari"
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data/users.sqlite3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app) 


event_post_args = reqparse.RequestParser() 
event_post_args.add_argument("title", type=str, help="Title of the event is required!", required = True)
event_post_args.add_argument("description", type=str, help="Description on the event", required = True)
event_post_args.add_argument("type", type=int, help="You must set the type of the event", required = True)
event_post_args.add_argument("lon", type=float, help="You must set the longtitude of the event", required = True)
event_post_args.add_argument("lat", type=float, help="You must set the latitude of the event", required = True)

event_update_args = reqparse.RequestParser()
event_update_args.add_argument("title", type=str, help="Title of the event is required!")
event_update_args.add_argument("description", type=str, help="Description on the event")
event_update_args.add_argument("type", type=int, help="You must set the type of the event")
event_update_args.add_argument("lon", type=float, help="You must set the longtitude of the event")
event_update_args.add_argument("lat", type=float, help="You must set the latitude of the event")


resource_fields = {
	'id' : fields.Integer,
	'title' : fields.String,
	'description' : fields.String,
	'type' : fields.Integer,
	'lon' : fields.Float,
	'lat': fields.Float
}

class EventType(Enum):
	FIRE = 1
	FLOOD = 2
	PLAGUE = 3


class EventModel(db.Model):
	__tablename__ = 'events'
	id = db.Column(db.Integer, primary_key=True)
	title =  db.Column(db.String(50), nullable=False)
	description =  db.Column(db.String(500), nullable=False)
	type =  db.Column(db.Integer, nullable=False)
	lon =  db.Column(db.Float, nullable=False)
	lat =  db.Column(db.Float, nullable=False)

	def __repr__(self):
		return f"Event(title={title}, description={description}, type={type})"


# Single event object requst handler - RestAPI
class EventResource(Resource):
	""" get an event record by REST Api"""
	@marshal_with(resource_fields)
	def get(self, event_id):
		result = EventModel.query.filter_by(event_id).first()
		print(str(event_id), file=sys.stdout)
		if not result:
			abort(404, "The event not found")
		return result

	""" Create an event record by REST Api"""
	@marshal_with(resource_fields)
	def post(self, event_id):
		args = event_post_args.parse_args()
		result = EventModel.query.filter_by(title = args['title']).first()
		if result:
			print(str(result.title), file=sys.stdout)
			abort(409, message="The event is already exist!!")
		max_id = db.session.query(func.max(EventModel.id)).scalar()
		if not max_id:
			max_id = 0
		event = EventModel(id=max_id + 1, title=args['title'], description=args['description'], type=args['type'], lon = args['lon'], lat = args['lat'])
		db.session.add(event)
		db.session.commit()

		return event, 201

	""" Update a record of any exist event by REST Api"""
	@marshal_with(resource_fields)
	def put(self, event_id):
		print(str(event_id), file=sys.stdout)
		args = event_update_args.parse_args()
		result = EventModel.query.filter_by(id=event_id).first()
		if not result:
			abort(404, message="The event is not exist")

		if args['title']:
			result.title = args["title"]
		if args['description']:
			result.description = args["description"]
		if args['type']:
			result.type = args["type"]
		if args['lon']:
			result.lon = args["lon"]
		if args['lat']:
			result.lat = args["lat"]

		db.session.commit()

		return result

	@marshal_with(resource_fields)
	def delete(self, event_id):
		result = EventModel.query.filter_by(id=event_id).first()
		if not result:
			abort(404, message="The event is not exist")
		db.session.delete(result)
		db.session.commit()
		return result


# Multi event object requst handler - RestAPI
class EventsResource(Resource):
	""" get an events list by REST Api"""
	@marshal_with(resource_fields)
	def get(self):
		result = EventModel.query.all()
		if not result:
			abort(404, message = "No events has found")
		return result


# Event object type
class Event(object):
	"""The event class presenting the events for the saved list"""
	def __init__(self, id, title, description, EventType: type):
		super(Event, self).__init__()
		self.id = id
		self.title = title
		self.description = descript
		self.type = type

		

# RestApi endpoints
api.add_resource(EventResource, "/event/<int:event_id>")
api.add_resource(EventsResource, "/events/")


@app.route("/")
def home():
	return render_template("home.html")

"""
@app.route("/map/")
@app.route("/map/event/<event_id>")
@app.route("/map/events")
def map_home():
	return render_template("map.html")
"""

if __name__ == "__main__":
	db.create_all()
	app.run(debug=True)