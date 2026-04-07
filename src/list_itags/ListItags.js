import React, { act, useEffect, useState } from 'react'
import './listItags.css'

export default function ListItags() {
    const [action_list, setActionList] = useState([]);

    useEffect(()=>{
        const get_all_actions = async ()=>{
            let http_resp = await fetch("/get_itag_actions", {method: "POST"});
            http_resp = JSON.parse(await http_resp.text());
            setActionList(http_resp["actions"]);
        };
        get_all_actions();
    }, [])
  return (
    <div className='list_itags_body'>
        <h2>Itags Action List</h2>
        <table className='action_list_table'>
            <tbody>
                <tr>
                    <th>Action</th>
                    <th>Usage</th>
                </tr>
                {action_list.map((act_, idx_)=>{
                    return (
                        <tr key={"act_row"+idx_}>
                            <td className='action'>{act_}</td>
                            <td className='action usage'>user1_{act_}_user2</td>
                        </tr>
                    )
                })}
                
            </tbody>
        </table>
    </div>
  )
}
