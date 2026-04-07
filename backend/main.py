from flask import Flask, render_template, request, json, session
from dotenv import load_dotenv
import os, datetime
from pymongo import MongoClient
from bson.objectid import ObjectId
import random
from pilmoji import Pilmoji
from PIL import Image, ImageFont, ImageDraw
from supabase import create_client

load_dotenv(".env")

mongo_cli = MongoClient(os.getenv("MONGODB_URL"), 27017)
mongo_db = mongo_cli["WhatsappImagePopperDB"]
links_coll = mongo_db["NameLinkMapper"]

mongo_doc_id = ObjectId("6804a224d9cdece221521625")
if links_coll.find_one({"_id": mongo_doc_id}) is None:
    links_coll.insert_one({"_id": mongo_doc_id})

supabase_cli = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))
itag_imgs_bucket = None
try:
    itag_imgs_bucket = supabase_cli.storage.get_bucket("itag_images")
except BaseException as e:
    print("Error : ", e)
    itag_imgs_bucket = supabase_cli.storage.create_bucket("itag_images", options={"public": True, "allowed_mime_types": ["image/png"]})
    print("Error resolved")

def createTempImage(emoji):
    emoji = emoji[0]
    temp_file_name = f"{random.randint(0, 100000)}".zfill(8)+".png"
    with Image.new('RGB', (300, 300), (255, 255, 255)) as image:
        font = ImageFont.truetype('arial.ttf', 280)
        with Pilmoji(image) as pilmoji:
            pilmoji.text((10, 10), emoji, (0, 0, 0), font)
        image.save(f"../build/{temp_file_name}")
    return temp_file_name

# ------------------------- WEB APP ---------------------------
app = Flask(__name__, template_folder="../build", static_folder="../build", static_url_path="/")
app.secret_key = os.getenv("SECRET_KEY")

@app.route("/")
@app.route("/dashboard")
@app.route("/login")
@app.route("/signup")
@app.route("/add_image")
@app.route("/management")
@app.route("/add_itag_img")
@app.route("/list_itags")
def home(*args):
    return render_template("index.html")

@app.errorhandler(404)
def on_err_404(*args):
    return render_template("use_page.html", image_url=f"{request.url_root}not_found.png")

@app.route("/use")
@app.route("/use/<path:image_url>")
def on_use(image_url=None):
    if image_url:
        processed_url = image_url.split("/")
        while '' in processed_url:
            processed_url.remove('')
        if len(processed_url) >= 2:
            ep = processed_url[0]
            img_name = processed_url[1]
            if img_name in ["username", "password"]:
                return render_template("use_page.html", image_url=f"{request.url_root}security_bypass_failed.jpg")
            url_ = links_coll.find_one({"endpoint": ep}, {"_id": False, img_name: True})
            if url_:
                return render_template("use_page.html", image_url=url_[img_name])

        if len(processed_url) >= 1:
            img_name = processed_url[0]
            if img_name in ["username", "password"]:
                return render_template("use_page.html", image_url=f"{request.url_root}security_bypass_failed.jpg")
            url_ = links_coll.find({img_name: {"$exists": True}}, {"_id": False, img_name: True}).limit(10)
            url_ = list(url_)
            if len(url_):
                url_ = random.choice(url_)
                return render_template("use_page.html", image_url=url_[img_name])
    return render_template("use_page.html", image_url=f"{request.url_root}not_found.png")

images_created = {}
@app.route("/emoji")
@app.route("/emoji/<path:emoji_>")
def on_emoji(emoji_=None):
    if emoji_ is None:
        return render_template("use_page.html", image_url=f"{request.url_root}not_found.png")
    ix = list(images_created.items())
    for k, v in ix:
        print(datetime.datetime.now().timestamp() - v)
        if datetime.datetime.now().timestamp() - v > 10:
            os.remove(f"../build/{k}")
            del images_created[k]
    img_name = createTempImage(emoji_)
    images_created[img_name] = datetime.datetime.now().timestamp()
    return render_template("use_page.html", image_url=f"{request.url_root}{img_name}")

itag_imgs = {}
@app.route("/itag")
@app.route("/itag/<path:itag_command>")
def on_itag_command(itag_command=None):
    if itag_command is None:
        return render_template("use_page.html", image_url=f"{request.url_root}invalid_itag_cmd.png")

    if len(itag_command.split("_")) != 3:
        return render_template("use_page.html", image_url=f"{request.url_root}invalid_itag_cmd.png")

    user_a, action, user_b = itag_command.split("_")

    docs_ = mongo_db.get_collection("itag_data").find({"actions": {"$in": [action]}})
    docs_ = list(docs_)
    if not len(docs_):
        return render_template("use_page.html", image_url=f"{request.url_root}no_itag_action.png")

    doc_ = random.choice(docs_)

    ix = list(itag_imgs.items())
    for k, v in ix:
        if datetime.datetime.now().timestamp() - v > 10:
            os.remove(f"../build/{k}")
            del itag_imgs[k]
    temp_file_name = f"{random.randint(0, 100000)}".zfill(8) + ".png"
    with open(f"../build/{temp_file_name}", "wb") as fp:
        fp.write(supabase_cli.storage.from_("itag_images").download(doc_["img_file_name"]))
    img_ = Image.open(f"../build/{temp_file_name}")
    font_ = ImageFont.truetype("arial.ttf", 36)
    pen = ImageDraw.Draw(img_)
    pen.text((doc_["master"]["x"], doc_["master"]["y"]), user_a, (255, 0, 0), font_, stroke_width=2, stroke_fill=(255, 255, 0))
    pen.text((doc_["slave"]["x"], doc_["slave"]["y"]), user_b, (0, 0, 255), font_, stroke_width=2, stroke_fill=(255, 255, 0))
    img_.save(f"../build/{temp_file_name}")
    return render_template("use_page.html", image_url=f"{request.url_root}{temp_file_name}")

@app.route("/dashboard/put_img_link", methods=["POST"])
def put_img_link():
    if "username" not in session:
        return "USER_NOT_LOGGED_IN"
    data_ = json.loads(request.data.decode())
    l = len(links_coll.find_one({"username": session["username"], "password": session["password"]}))
    if l-4 > int(os.getenv("MAX_UPLOADS_ALLOWED")):
        return "OUT_OF_LIMIT"

    if links_coll.find_one({"username": session["username"], "password": session["password"], data_["image_name"]: {"$exists": True}}) is None:
        links_coll.update_one({"username": session["username"], "password": session["password"]}, {"$set": {data_["image_name"]: data_["image_url"]}})
        return "OK"
    return "FAILED"


@app.route("/signup/register", methods=["POST"])
def onSignup():
    data_ = json.loads(request.data.decode())
    if links_coll.find_one({"username": data_["username"]}) is not None:
        return "USERNAME_ALREADY_EXISTS"
    if links_coll.find_one({"endpoint": data_["endpoint"]}) is not None:
        return "ENDPOINT_ALREADY_EXISTS"
    inserted_ = links_coll.insert_one({"username": data_["username"], "password": data_["password"], "endpoint": data_["endpoint"]})
    if inserted_.acknowledged:
        session["username"] = data_["username"]
        session["password"] = data_["password"]
        session["endpoint"] = data_["endpoint"]
        return "OK"
    else:
        return "FAILED"

@app.route("/login/login_now", methods=["POST"])
def login_now():
    data_ = json.loads(request.data.decode())
    user_acc_data = links_coll.find_one({"username": data_["username"], "password": data_["password"]})
    if user_acc_data is None:
        return json.dumps({"status": "ACCOUNT_NOT_EXISTS"})
    session["username"] = user_acc_data["username"]
    session["password"] = user_acc_data["password"]
    session["endpoint"] = user_acc_data["endpoint"]
    return json.dumps({"status": "OK", "username": user_acc_data["username"], "password": user_acc_data["password"], "endpoint": user_acc_data["endpoint"]})

@app.route("/login/get_user_login", methods=["POST"])
def get_user_login():
    if "username" in session:
        return json.dumps({"username": session["username"], "password": session["password"], "endpoint": session["endpoint"]})
    else:
        return json.dumps({"failed": "NOT_LOGGED_IN"})

@app.route("/login/logout", methods=["POST"])
def logout():
    del session["username"]
    del session["password"]
    del session["endpoint"]
    return "OK"

@app.route("/delete_acc", methods=["POST"])
def delete_acc():
    data_ = json.loads(request.data.decode())
    res = links_coll.delete_one({"username": data_["username"], "password": data_["password"]})
    return "OK" if res.deleted_count else "FAILED"

@app.route("/update_acc", methods=["POST"])
def update_acc():
    data_ = json.loads(request.data.decode())
    res = links_coll.update_one({"username": data_["username"], "password": data_["password"]}, {"$set": data_["updated_info"]})
    return "OK" if res.acknowledged else "FAILED"

@app.route("/get_img_links", methods=["POST"])
def get_img_links():
    data_ = json.loads(request.data.decode())
    to_send = links_coll.find({}, {"_id": False, "username": False, "password": False}).skip(data_["doc_no"]).limit(1)
    return json.dumps({"doc": list(to_send), "total_docs": links_coll.count_documents({})})

@app.route("/get_img_links/by_creds", methods=["POST"])
def get_img_links_by_creds():
    to_send = links_coll.find_one({"username": session["username"], "password": session["password"], "endpoint": session["endpoint"]}, {"_id": False, "username": False, "password": False, "endpoint": False})
    return json.dumps({"doc": to_send})

@app.route("/delete_post/by_creds", methods=["POST"])
def delete_post_by_creds():
    data_ = request.data.decode()
    deleted_ = links_coll.update_one({"username": session["username"], "password": session["password"], "endpoint": session["endpoint"]}, {"$unset": {data_: ""}})
    if deleted_.acknowledged:
        return "OK"
    else:
        return "FAILED"

@app.route("/check_admin", methods=["POST"])
def check_admin():
    data_ = json.loads(request.data.decode())
    coll_ = mongo_db.get_collection("admin_creds")
    admin_creds = coll_.find_one({"username": data_["username"], "password": data_["password"]})
    if not admin_creds:
        return "NOT_ADMIN"
    else:
        return "OK"

@app.route("/get_itag_actions", methods=["POST"])
def get_itag_actions():
    docs_ = mongo_db.get_collection("itag_data").find({}, {"actions": True})
    to_ret = set()
    for doc in docs_:
        to_ret = to_ret | set(doc["actions"])
    return json.dumps({"actions": list(to_ret)})

@app.route("/publish_itag_img", methods=["POST"])
def publish_itag_img():
    try:
        img_data, json_data = request.data.split(b"<&^*SAPERATOR*^&>")
        json_data = json.loads(json_data.decode())

        coll_ = mongo_db.get_collection("itag_data")
        doc_ = coll_.insert_one(json_data)
        supabase_cli.storage.from_("itag_images").upload(file=img_data, path=f"{doc_.inserted_id}.png", file_options={"content-type": "image/png"})
        coll_.update_one({"_id": ObjectId(doc_.inserted_id)}, {"$set": {"img_file_name": f"{doc_.inserted_id}.png"}}, True)
        return "OK"
    except BaseException as e:
        return "ERROR"

# -----------------------> API ENDPOINTS <------------------------
@app.route("/api/put_img_link", methods=["POST"])
def api_put_image():
    data_ = json.loads(request.data.decode())

    l = len(links_coll.find_one({"username": data_["username"], "password": data_["password"]}))
    if l-4 > int(os.getenv("MAX_UPLOADS_ALLOWED")):
        return "OUT_OF_LIMIT"

    if links_coll.find_one({"username": data_["username"], "password": data_["password"], data_["image_name"]: {"$exists": True}}) is None:
        links_coll.update_one({"username": data_["username"], "password": data_["password"]}, {"$set": {data_["image_name"]: data_["image_url"]}})
        return "OK"
    return "FAILED"

@app.route("/api/img_links_by_creds", methods=["POST"])
def img_links_by_creds():
    data_ = json.loads(request.data.decode())
    to_send = links_coll.find_one({"username": data_["username"], "password": data_["password"]},{"_id": False, "username": False, "password": False, "endpoint": False})
    return json.dumps(to_send)

@app.route("/api/delete_post", methods=["POST"])
def api_delete_post():
    data_ = json.loads(request.data.decode())
    deleted_ = links_coll.update_one({"username": data_["username"], "password": data_["password"]},
        {"$unset": {data_["img_name"]: ""}})
    if deleted_.acknowledged:
        return "OK"
    else:
        return "FAILED"

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080)