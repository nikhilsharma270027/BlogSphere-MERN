import React, { useEffect, useRef, useState } from 'react'

export let activeTabLineRef;
export let activeTabRef;

const InPageNavigation = ({ routes, defaultHidden = [ ], defaultActiveIndex = 0, children }) => {

  activeTabLineRef = useRef();
  activeTabRef = useRef([]);

  let [ inPageNavIndex, setInPageNavIndex ] = useState(defaultActiveIndex);

  let [ isResizeEventAdded, setIsResizeEventAdded ] = useState(false)

  let [ width, setWidth ] = useState(window.innerWidth)

  const changePageState = (btn, i) => {
    ///console.log(btn,i)

        let { offsetWidth, offsetLeft } = btn; //btn.offsetWidth

        activeTabLineRef.current.style.width = offsetWidth + "px"; //12px
        activeTabLineRef.current.style.left = offsetLeft + "px"; //12px

        setInPageNavIndex(i);
  }

  useEffect(() => {

        if( width > 766 && inPageNavIndex != defaultActiveIndex){
            changePageState( activeTabRef.current[defaultActiveIndex], defaultActiveIndex)
        }
        // changePageState( btn, i)
        // changePageState( activeTabRef.current[defaultActiveIndex], defaultActiveIndex)

        if(!isResizeEventAdded){
            window.addEventListener('resize', () => {
                if(!isResizeEventAdded){
                    setIsResizeEventAdded(true)
                }

                setWidth(window.innerWidth)
            })
        }
  },[defaultActiveIndex, width])

  return (
    <>
        <div className='relative mb-8 bg-white border-b border-grey flex flex-nowrap overflow-x-auto'>{/*overflow is there is scrollbar */}
            
            {
                routes.map((route, i) => {
                    return (
                        <button 
                        ref={ref => (activeTabRef.current[i] = ref)}
                        key={i} className={"p-4 px-5 capitalize " + ( inPageNavIndex == i ? "text-black" : "text-dark-grey " ) + ( defaultHidden.includes(route) ? " " : " " )}
                            onClick={(e) => { changePageState(e.target, i) }}
                        >
                            { route }
                        </button>
                    )
                })
            }

            <hr ref={activeTabLineRef} className='absolute bottom-0 duration-300 border-grey'/>
        </div>

        {/* there is array of data in the inpagenavbar , so if we want to see it ,
        to know to index ,we will take info from the inPageNavIndex  */}
        { Array.isArray(children) ? children[inPageNavIndex] : children }
    </>
  )
}

export default InPageNavigation
