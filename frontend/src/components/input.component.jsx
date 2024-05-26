import React, { useState } from 'react'


const InputBox = ({ name, type, id, value, placeholder, icon, disable = false }) => {

    const [ passwordvisible, setPasswordVisible ] = useState(false)
  return (
    <div className='relative w-[100%] mb-4'>
      <input 
        name={name}
        type={type == "password" ? passwordvisible ? "text" : 'password' : type}
        // defaultValue={value}
        id={id}
        disabled={disable}
        value={value}
        placeholder={placeholder}
        className="input-box"
      />

      <i className={"fi " + icon + " input-icon"} />
      
      {
        type == "password" ?
        <i className={"fi fi-rr-eye" + (!passwordvisible ? "-crossed" : "" )+ " input-icon left-[auto] right-4 cursor-pointer"}
        onClick={() => setPasswordVisible(currentVal => !currentVal)}></i>
        : ""
      }

    </div>
  )
}

export default InputBox
