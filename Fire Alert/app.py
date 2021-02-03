from flask import Flask, render_template, url_for, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from enum import Enum
import sys
import os
from datetime import datetime
from map.main import main
from flask_jsglue import JSGlue
from flask import  jsonify


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
		return f"Event(title={self.title}, description={self.description}, type={self.type})"


# Single event object requst handler - RestAPI
class EventResource(Resource):
	""" get an event record by REST Api"""
	@marshal_with(resource_fields)
	def get(self, event_id):
		result = EventModel.query.filter_by(event_id).first()
		print(str(event_id), file=sys.stdout)
		if not result:
			logServerEvent(f"GET Single: {event_id} not exist and aborted.")
			abort(404, "The event not found")
		logServerEvent(f"GET Single: {event_id} was found.")
		return result

	""" Create an event record by REST Api"""
	@marshal_with(resource_fields)
	def post(self, event_id):
		args = event_post_args.parse_args()
		result = EventModel.query.filter_by(title = args['title']).first()
		if result:
			logServerEvent(f"POST: {event_id} creation aborted!")
			print(str(result.title), file=sys.stdout)
			abort(409, message="The event is already exist!!")
		max_id = db.session.query(func.max(EventModel.id)).scalar()
		if not max_id:
			max_id = 0
			logServerEvent(f"POST: The first record of the events is under processing...")
		event = EventModel(id=max_id + 1, title=args['title'], description=args['description'], type=args['type'], lon = args['lon'], lat = args['lat'])
		db.session.add(event)
		db.session.commit()

		logServerEvent(f"POST: new Event record created with id: {max_id} {event.__repr__()}!")

		return event, 201

	""" Update a record of any exist event by REST Api"""
	@marshal_with(resource_fields)
	def put(self, event_id):
		print(str(event_id), file=sys.stdout)
		args = event_update_args.parse_args()
		result = EventModel.query.filter_by(id=event_id).first()
		if not result:
			logServerEvent(f"PUT:  updateing {event_id} aborted!")
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

		logServerEvent(f"PUT:  {event_id}  {result.__repr__()} successfuly updated!")
		return result

	#@marshal_with(resource_fields)
	def delete(self, event_id):
		result = EventModel.query.filter_by(id=event_id).first()
		if not result:
			logServerEvent(f"Delete:  failed to deleted {event_id}!")
			abort(404, message="The event is not exist")
		del_id = result.id
		db.session.delete(result)
		db.session.commit()
		logServerEvent(f"Delete: {del_id} has deleted!")
		return del_id


# Multi event object requst handler - RestAPI
class EventsResource(Resource):
	""" get an events list by REST Api"""
	@marshal_with(resource_fields)
	def get(self):
		try:
			result = EventModel.query.all()
			if not result:
				logServerEvent("Get all: result is empty!")
				abort(404, message = "No events has found")

			logServerEvent("Get all: result retrived successfuly")
			return result
		except:
			 logServerEvent("Get all: Failed to retrive any event!")
			 abort(404, message = "No events has found")


# Event object type
class Event(object):
	"""The event class presenting the events for the saved list"""
	def __init__(self, id, title, description, EventType: type):
		super(Event, self).__init__()
		self.id = id
		self.title = title
		self.description = descript
		self.type = type


def logServerEvent(eventText):
	t = datetime.now().strftime('%m/%d/%Y, %H:%M:%S')
	ip = request.remote_addr;
	res = f"{t}: client ip: {ip}, event: {eventText}\n"
	with open("log.txt", "a") as fo:
   		fo.write(res)

# RestApi endpoints
api.add_resource(EventResource, "/event/<int:event_id>")
api.add_resource(EventsResource, "/events/")


@app.route("/")
def home():
	logServerEvent("Home page")
	return render_template("home.html")


# running the app in debug mode - i made it for the developement process
if __name__ == "__main__":
	db.create_all()
	app.run(host='0.0.0.0', debug=True)