from flask import Flask, render_template, url_for, Blueprint, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_restful import Api, Resource, reqparse, abort, fields, marshal_with
from enum import Enum

main = Blueprint("main", __name__, static_folder="static", template_folder="templates")


@main.route("/")
@main.route("/event/<event_id>")
#@main.route("/events")
def map_home():
	return render_template("map.html")