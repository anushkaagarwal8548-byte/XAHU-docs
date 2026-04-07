import React, { useEffect, useState } from 'react'
import './addItag.css'
import { Link } from 'react-router-dom';
import { Plus, RefreshDouble, Xmark, XmarkCircle } from 'iconoir-react';

function CategorySelectedElement(props) {
    return (
        <div className='category_selected'>
            <span>{props.category_name}</span>
            <Xmark width={15} height={15} className='rm_category' onClick={props.on_delete} />
        </div>
    )
}
function PublisherPopup(props) {
    const [categories_selected, setCategoriesSelected] = useState([]);
    const [custom_category_val, setCustomCategoryVal] = useState("");
    const [already_ex_categories, setAlreadyExCategories] = useState([]);
    const [is_publishing, setIsPublishing] = useState(false);

    function change_custom_category(ele) {
        setCustomCategoryVal(ele.target.value);
    }

    function add_custom_category() {
        let cur_cs = [...categories_selected];
        if (cur_cs.includes(custom_category_val) || !custom_category_val.trim()) {
            return;
        }
        let special_chars = "!*'();:@&=+$,/?#[].~ _";
        for (let i = 0; i < special_chars.length; i++) {
            if (custom_category_val.includes(special_chars.charAt(i))) {
                props.create_msg("FAILED : Only - is allowed special characters for tag category, please remove all other special characters.");
                return;
            }
        }
        cur_cs.push(custom_category_val);
        setCategoriesSelected(cur_cs);
    }

    function on_select_category(ele) {
        let cur_cs = [...categories_selected];
        if (cur_cs.includes(ele.target.value)) {
            return;
        }
        cur_cs.push(ele.target.value);
        setCategoriesSelected(cur_cs);
    }

    function remove_category(idx) {
        let cur_cs = [...categories_selected];
        cur_cs.splice(idx, 1);
        setCategoriesSelected(cur_cs);
    }

    function on_publish() {
        if (!categories_selected.length) {
            props.create_msg("Please select atleast one category.");
            return;
        }
        setIsPublishing(true);
        props.on_publish(categories_selected).then().finally(()=>{
            setIsPublishing(false);
        });
    }

    useEffect(() => {
        const get_actions = async () => {
            let http_resp = await fetch("/get_itag_actions", { method: "POST" });
            http_resp = JSON.parse(await http_resp.text());
            setAlreadyExCategories(http_resp["actions"]);
        }
        get_actions();
    }, [])

    return (
        <div className='publish_popup_body'>
            <XmarkCircle width={25} height={25} color='red' onClick={props.on_close_win} className='close_win' />
            <h3 className='publisher_heading'>Publishing Itag Image</h3>
            <select defaultValue="0xe" className='existing_category_select' onChange={on_select_category}>
                <option value="0xe" disabled>Select Itag Category</option>
                {already_ex_categories.map((itm, idx) => {
                    return <option value={itm} key={"alr_ex_cat_" + idx}>{itm}</option>
                })}
            </select>
            <div style={{ display: "flex", gap: "4px" }} className='custom_category_box'>
                <input list={custom_category_val.length > 2 ? 'category_suggestion' : ""} type="text" className='custom_entry good_input' placeholder='Custom Category' onChange={change_custom_category} />
                <datalist id='category_suggestion'>
                    {already_ex_categories.map((itm, idx) => {
                        return <option value={itm} key={"alr_ex_cat2_" + idx}>{itm}</option>
                    })}
                </datalist>
                <Plus width={30} height={30} className='add_custom' onClick={add_custom_category} />
            </div>
            <div className='categories'>
                {categories_selected.map((val, idx) => {
                    return <CategorySelectedElement key={"cat_sele_ele_" + idx} category_name={val} on_delete={() => { remove_category(idx) }} />
                })}
            </div>
            {is_publishing ? 
            <button className='normal_btn_a'>Publishing <RefreshDouble width={20} height={20} strokeWidth={2} className='loader' /></button>
            :
            <button className='normal_btn_a' onClick={on_publish}>Publish</button>
            }
        </div>
    )
}

export default function AddItag(props) {
    const [admin_login_status, setAdminLoginStatus] = useState(null);
    const [selected_img, setSelectedImg] = useState(null);
    const [selected_img_url, setSelectedImgURL] = useState(null);
    const [publisher_popup, setPublisherPopup] = useState(null);
    const [location_data, setLocationData] = useState({});
    const [tag_elements, setTagElements] = useState({});

    const on_admin_login = async () => {
        if (!props.login_creds) {
            props.create_msg("No login credentials found! Please login.");
            return;
        }
        let http_resp = await fetch("/check_admin", { method: "POST", body: JSON.stringify(props.login_creds) });
        http_resp = await http_resp.text();
        if (http_resp === "OK") {
            setAdminLoginStatus("ADMIN_CREDS_FOUND");
            props.create_msg("Welcome back admin.");
        }
        else {
            props.create_msg("Your login credentials not have admin privileges.");
        }
    }

    const on_select_img = () => {
        let img_input = document.createElement("input");
        img_input.type = "file";
        img_input.multiple = false;
        img_input.onchange = () => {
            load_image(img_input.files[0]);
        }
        img_input.click();
    }

    const on_paste_image = (eve) => {
        let clipboard_imgs = eve.clipboardData.items;
        for (let item of clipboard_imgs) {
            let file_ = item.getAsFile();
            console.log(file_)
            if (file_){
                load_image(file_);
            }
        }
    }

    const load_image = (img_blob) => {
        let img_tag = new Image();
        img_tag.onload = () => {
            let w = img_tag.width;
            let h = img_tag.height;
            while (w > 512 && h > 512) { // manages aspect ratio.
                w /= 2;
                h /= 2;
            }
            console.log(w, h);
            let canvas_ = document.createElement("canvas");
            canvas_.width = w;
            canvas_.height = h;

            let canvas_ctx = canvas_.getContext("2d");
            canvas_ctx.drawImage(img_tag, 0, 0, w, h);
            canvas_.toBlob((blob_) => {
                setSelectedImg(blob_);
                setSelectedImgURL(URL.createObjectURL(blob_));
            })
        }
        img_tag.src = URL.createObjectURL(img_blob);
    }

    function add_tagger(x, y, role) {
        const img_holder = document.getElementsByClassName("img_holder")[0];
        let taggr = document.createElement("span");
        taggr.innerText = "0";
        taggr.className = `tagger ${role}`;
        taggr.style.left = `${x}px`;
        taggr.style.top = `${y}px`;
        img_holder.appendChild(taggr);
        return taggr;
    }

    function on_tag(btn, role) {
        const target_img_ele = document.getElementsByClassName("target_img")[0];
        btn.style.backgroundColor = "#c3c3c3";
        btn.onclick = () => { };
        target_img_ele.onclick = (eve) => {
            if (tag_elements[role]) {
                tag_elements[role].remove();
                delete location_data[role];
                delete tag_elements[role]
            }
            location_data[role] = { "x": eve.offsetX, "y": eve.offsetY };
            var trig_ = add_tagger(location_data[role]["x"], location_data[role]["y"], role);
            tag_elements[role] = trig_;
            btn.style.backgroundColor = "";
            btn.onclick = () => { on_tag(btn, role) };
            target_img_ele.onclick = () => { }
            console.log(location_data);
        }
    }

    function onClearTags() {
        setLocationData({});
        Object.values(tag_elements).forEach(element => {
            element.remove();
        });
        setTagElements({});
    }

    async function finally_publish(img_actions) {
        let json_to_send = JSON.parse(JSON.stringify(location_data));
        json_to_send["actions"] = img_actions;
        let to_send = new Blob([selected_img, "<&^*SAPERATOR*^&>", JSON.stringify(json_to_send)], { type: "application/octet-stream" });
        let http_resp = await fetch("/publish_itag_img", { method: "POST", body: to_send });
        http_resp = await http_resp.text();
        if (http_resp === "OK") {
            setPublisherPopup(null);
            onClearTags();
            setSelectedImg(null);
            setSelectedImgURL(null);
            props.create_msg("Itag Image as been published.");
        }
        else {
            props.create_msg("Failed to publish Itag image.");
        }
        console.log(http_resp);
    }

    function on_publish_img() {
        if (!selected_img) {
            props.create_msg("Please select an image first.");
            return;
        }
        if (Object.keys(location_data).length < 2) {
            props.create_msg("Please provide master and slave tags.");
            return;
        }
        setPublisherPopup(<PublisherPopup on_publish={finally_publish} on_close_win={() => { setPublisherPopup(null) }} create_msg={props.create_msg} />);
    }

    if (admin_login_status !== "ADMIN_CREDS_FOUND") {
        return (
            <div className='no_admin_login_area'>
                <div className='admin_entries'>
                    <h2 className='heading'>Admin Credential Check</h2>
                    <span className='page_access_info'>**This page is only for admin usage, if you are admin please validate your login credentials by clicking below, if you are not so please go <Link to={"/"}>back to home</Link></span>
                    <button className='normal_btn_a' onClick={on_admin_login} >Check Credentials</button>
                </div>
            </div>
        )
    }

    return (
        <div className='add_itag_body'>
            {publisher_popup}
            <h3>Add new tagged image</h3>
            <header className="header_x">
                <button className="opts select_image" onClick={on_select_img}>Select Image</button>
                <button className="opts publish" onClick={on_publish_img}>Publish</button>
                <button className="opts master" onClick={(ele) => { on_tag(ele.target, "master") }}>Master Tag</button>
                <button className="opts slave" onClick={(ele) => { on_tag(ele.target, "slave") }}>Slave Tag</button>
                <button className="opts clear" onClick={onClearTags}>Clear Tags</button>
            </header>

            <div className="img_holder" onPaste={on_paste_image} >
                {!selected_img_url ? 
                <span>No Image is currently selected, please select an image or <b>past an image here</b>.</span>
                :
                <img src={selected_img_url} alt="not selected" className="target_img"  />
                }
                <span className="tagger">0</span>
            </div>
        </div>
    )
}
