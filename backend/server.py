# CommuniCare: Backend
# Author: Dan Shan
# Date: 2025-08-01
# Updated: 2025-08-02
from flask import Flask, request, jsonify, Response
from google import genai
from dotenv import load_dotenv
import os
from flask_cors import CORS
from base64 import b64decode
import random
import traceback
from flask_jwt_extended import (
    JWTManager, create_access_token, get_jwt_identity, verify_jwt_in_request
)
from hashlib import sha256
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime

load_dotenv(".backend.env")

app = Flask('app')
gemini_client=genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
CORS(app, origins=['http://localhost:7979'], methods=['POST', 'GET'])

secret_key = os.getenv("SECRET_KEY")

app.config['SECRET_KEY'] = secret_key
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY")
jwt = JWTManager(app)

mongo_client = MongoClient(os.getenv("MONGO_STRING"))
db = mongo_client['communicare']
doctors = db["doctors"]
patients = db["patients"]
body_submissions = db["body_submissions"]


@app.route('/images/<name>', methods=['GET'])
def get_image_route(name: str):
    with open("images/" + name, 'rb') as f:
        contents = f.read()
    r = Response(contents)
    r.headers['Content-Type'] = 'image/png'
    return r


@app.route('/doctor-patients', methods=['GET'])
def find():
    try:
        verify_jwt_in_request()
    except Exception:
        return {"message": "Please log in"}, 400
    try:
        target_doctor_id = get_jwt_identity()
        res = []
        for name in patients.find():
            doc_id = name["doctor_id"]
            if doc_id == target_doctor_id:
                res.append({"name": name["name"], "shareKey": str(name["unique_id"])})
        res.sort(key=lambda name: name["name"])
        return jsonify(res), 200
    except Exception as e:
        traceback.print_exc()
        return {"message": str(e)}, 500


@app.route('/body', methods=['POST'])
def body_route():
    # get json from request
    try:
        json = request.get_json()
    except:
        return {"message": "Invalid request body"}, 400
    
    image = json.get('image') # image of the body
    symptoms = json.get('symptoms') # list containing all symptoms
    unique_id = json.get('shareKey') # unique patient ID
    additional = json.get('additional') # additional notes
    assert isinstance(image, str)
    assert isinstance(symptoms, list)
    assert isinstance(unique_id, int)
    assert isinstance(additional, str)

    # make sure the id is valid
    patient_data = patients.find_one({"unique_id": unique_id})
    if not patient_data:
        return {"message": "Invalid share ID. Ask your doctor for a new link."}, 400

    b64_string = "data:image/png;base64,"
    assert image.startswith(b64_string)
    # create randomly and uniqly named file
    img_id = random.randint(1_000_000, 9_999_999)
    filename = ""
    for _ in range(1000): # try up to 1000 times
        try:
            filename = f"images/body_{str(patient_data["_id"])}_{img_id}.png"
            with open(filename, "xb") as f:
                f.write(bytes(b64decode(image[len(b64_string):])))
            break
        except FileExistsError:
            img_id += 1
    
    if not filename:
        return {"message": "Unable to save."}, 400

    file = gemini_client.files.upload(file=filename)

    res = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            file,
            "You are a medical diagnostic system. You will be given an image with red bull's-eyes representing "
            "areas of pain, a list of the patient's symptoms, and any additional notes given by the patient; "
            "you will use this information to return an evaluation and diagnosis/diagnoses. "
            "Be matter-of-fact in your responses. Symptoms are as follows: " + ", ".join(symptoms) + ". "
            + (("The rest of this message is the user's additional notes: " + additional) if additional else "There "
               "are no additional notes given by the user.")
            # "Return the body parts of this image that have red bull's-eyes as a python list (only the list please)"
            # ". And how do they relate to the following symptoms: " + ", ".join(symptoms) + "? Be terse."
        ],
    )

    time_now = datetime.now()
    time_parts = [
        str(int(time_now.strftime("%d"))), time_now.strftime(" %B %Y at "), 
        str(int(time_now.strftime("%I"))), time_now.strftime(":%M %p")
    ]
    time_str = "".join(time_parts)

    body_submissions.insert_one({
        "patient_id": patient_data["_id"],
        "patient_name": patient_data["name"],
        "doctor_id": patient_data["doctor_id"],
        "image_path": filename,
        "symptoms": symptoms,
        "additional": additional,
        "diagnosis": res.text,
        "created": time_str
    })

    response = Response()
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:7979')
    return response, 204


@app.route('/patient-submissions', methods=['GET'])
def patient_submissions_route():
    try:
        verify_jwt_in_request()
    except Exception:
        return {"message": "Please log in"}, 400
    
    user_id = get_jwt_identity()
    
    submissions = body_submissions.find({"doctor_id": user_id}).sort("_id", -1)

    submissions_list = [
        {
            "patientId": str(s["patient_id"]),
            "patientName": s["patient_name"],
            "imagePath": s["image_path"],
            "symptoms": s["symptoms"],
            "additional": s.get("additional", ""),
            "diagnosis": s["diagnosis"],
            "created": s["created"]
        }
        for s in submissions
    ]
    return jsonify(submissions_list), 200


@app.route('/patient-doctor/<unique_id>', methods=['GET'])
def patient_doctor_route(unique_id: str):
    try:
        patient_data = patients.find_one({"unique_id": int(unique_id)})
    except ValueError:
        return {"message": "Invalid share link provided. Please ask your doctor for a new one."}, 400

    if patient_data is None:
        return {"message": "Invalid share link provided. Please ask your doctor for a new one."}, 400
    
    doctor = doctors.find_one({"_id": ObjectId(patient_data["doctor_id"])})

    if doctor is None:
        return {"message": "Your doctor could not be found in our records."}, 400
    
    return {"name": doctor["name"], "patientName": patient_data["name"]}, 200


# Use mongodb to store patient information
@app.route('/add-patient-data', methods=['POST'])
def add_patient_data_route():
    try:
        verify_jwt_in_request()
    except Exception:
        return {"message": "Please log in"}, 400
    
    # get json from request
    try:
        json = request.get_json()
    except:
        return {"message": "Invalid request body"}, 400
    
    # ensure valid request
    if not json.get("name"):
        return {"message": "Please provide a patient name."}, 400
    
    unique_id = random.randint(1_000_000, 9_999_999)
    while patients.find_one({"unique_id": unique_id}) is not None:
        unique_id += 1

    the_id = patients.insert_one({
        "name": json.get("name"),
        "unique_id": unique_id,
        "doctor_id": get_jwt_identity()
    }).inserted_id
    return {"patient_id": str(the_id)}, 200


# Use mongodb to query user information
@app.route('/user-data', methods=['GET'])
def user_data_route():
    try:
        verify_jwt_in_request()
    except Exception:
        return {"message": "Please log in"}, 400
    
    user_id = get_jwt_identity()

    data = doctors.find_one({"_id": ObjectId(user_id)})
    if not data:
        return {"message": "Please log in"}, 400
    
    user_data = {
        "name": data["name"],
        "email": data["email"]
    }

    if user_data:
        return jsonify(user_data), 200
    else:
        return jsonify({"message": "Invalid user ID"}), 400


# delete patient info from db through id
@app.route('/remove-patient', methods=['POST'])
def remove_patient_route():
    try:
        verify_jwt_in_request()
    except Exception:
        return {"message": "Please log in"}, 400
    
    # get json from request
    try:
        json = request.get_json()
    except:
        return {"message": "Invalid request body"}, 400
    
    patient_key = json.get('key')
    if not isinstance(patient_key, str) or not patient_key.isdigit():
        return {"message": "Invalid request body"}, 400
    
    patients.delete_one({"unique_id": int(patient_key)})
    return {}, 204


# Sign the user up
@app.route('/sign-up', methods=['POST'])
def sign_up_route():
    # don't need to be logged in to access this
    verify_jwt_in_request(optional=True)
    
    # get json from request
    try:
        json = request.get_json()
    except:
        return {"message": "Invalid request body"}, 400
    
    # ensure valid request
    if not json.get("name"):
        return {"message": "Please provide your name."}, 400
    if not json.get("email"):
        return {"message": "Please provide your email."}, 400
    if not json.get("password"):
        return {"message": "Please provide a password."}, 400
        
    if doctors.find_one({"email": json["email"]}) is not None:
        return {"message": "The provided email is already taken."}, 400
    
    # currently inserts test data, should insert user data
    the_id = doctors.insert_one({
        "name": json["name"],
        "email": json["email"],
        "pass": hash_password(json["password"])
    }).inserted_id
    print(the_id, "inserted")

    # make auth token
    auth_token = create_access_token(identity=str(the_id))
    return {"token": auth_token}, 200


# Log the user in
@app.route('/log-in', methods=['POST'])
def log_in_route():
    # don't need to be logged in to access this
    verify_jwt_in_request(optional=True)
    
    # get json from request
    try:
        json = request.get_json()
    except:
        return {"message": "Invalid request body"}, 400
    
    # ensure valid request
    if not json.get("email"):
        return {"message": "Please enter your email."}, 400
    if not json.get("password"):
        return {"message": "Please enter a password."}, 400

    user = doctors.find_one({
        "email": json["email"],
        "pass": hash_password(json["password"])
    })
    if not user:
        return {"message": "Invalid email or password provided."}, 400

    # make auth token
    auth_token = create_access_token(identity=str(user["_id"]))
    return {"token": auth_token}, 200


# Edit the user's data
@app.route('/edit-user', methods=['POST'])
def edit_user_route():
    try:
        verify_jwt_in_request()
    except Exception:
        return {"message": "Please log in"}, 400
    
    # get json from request
    try:
        json = request.get_json()
    except:
        return {"message": "Invalid request body"}, 400
    
    # ensure valid request
    if not json.get("name"):
        return {"message": "Please provide an name."}, 400
    if not json.get("email"):
        return {"message": "Please provide an email."}, 400
    
    doctor = doctors.find_one({"_id": ObjectId(get_jwt_identity())})
    if doctor is None:
        return {"message": "Invalid request body"}, 400
    
    collision = doctors.find_one({"email": json["email"]})
    if collision is not None and str(collision["_id"]) != str(doctor["_id"]):
        return {"message": "The provided email is already taken."}, 400
    
    # currently inserts test data, should insert user data
    doctors.update_one(
        {"_id": doctor["_id"]},
        {"$set": {
            "name": json["name"],
            "email": json["email"]
        }}
    )

    response = Response()
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:7979')
    return response, 204


# Hash password for database usage
def hash_password(password: str):
    return sha256(password.encode('utf-8')).hexdigest()


app.run(port=2)
