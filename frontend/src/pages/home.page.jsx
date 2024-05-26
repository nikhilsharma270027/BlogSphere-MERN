import React, { useEffect, useState } from "react";
import AnimationWrapper from "../common/page-animation";
import InPageNavigation from "../components/inpage-navigation.component";
import axios from "axios";
import Loader from "../components/loader.component";
import BlogPostCard from "../components/blog-post.component";
import MinimalBlogPost from "../components/nobanner-blog-post.component";
import { activeTabRef } from "../components/inpage-navigation.component";
import NoDataMessage from "../components/nodata.component";
import { FilterPaginationData } from "../common/filter-pagination-data";
import LoadMoreDataBtn from "../components/load-more.component";

const HomePage = () => {
  const [blogs, setBlog] = useState(null);
  //blogs = [ {}, {}, {} ]
  //blogs = {
  //   results: [ {}, {}, {}],
  //   page: 2,
  //   totalDocs: 10
  // }
  const [trendingBlogs, setTrendingBlog] = useState(null);
  const [pageState, setPageState] = useState("home");

  //filter state based og tags
  let categories = [
    "programming",
    "hollywood",
    "film making",
    "social media",
    "cooking",
    "tech",
    "finance",
    "travel",
  ];

  const fetchLatestBlogs = ({ page = 1 }) => {
    // let VITE_SERVER_DOMAIN = "http://localhost:3000";
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/latest-blogs", { page })
      .then( async ({ data }) => {
        // console.log(data);
        
         setBlog(data.blogs);

        let formatedData = await FilterPaginationData({
            state: blogs,
            data: data.blogs,
            page,
            countRoute: "/all-latest-blogs-count"
        })

        // console.log(formatedData)
        setBlog(formatedData);
        // setBlog(data.blogs);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchBlogByCategory = ({ page = 1 }) => {
    // let VITE_SERVER_DOMAIN = "http://localhost:3000";
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/search-blogs", { tag: pageState, page })
      .then( async ({ data }) => {

        let formatedData = await FilterPaginationData({
            state: blogs,
            data: data.blogs,
            page,
            countRoute: "/search-blogs-count",
            data_to_send: { tag: pageState }
        })
        // console.log(data.blogs);
        setBlog(formatedData);
        // setBlog(data.blogs);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchTrendingBlogs = () => {
    // let VITE_SERVER_DOMAIN = "http://localhost:3000";
    axios
      .get(import.meta.env.VITE_SERVER_DOMAIN + "/trending-blogs")
      .then(({ data }) => {
        // console.log(data.blogs);
        setTrendingBlog(data.blogs);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const loadBlogByCategory = (e) => {
    // console.log("clicked")
    let category = e.target.innerText.toLowerCase();

    setBlog(null);
    //setting to null bcuz to filtering acc to category/tags
    if (pageState == category) {
      setPageState("home");
      return;
    }

    setPageState(category);
  };

  useEffect(() => {
    activeTabRef.current[0].click();

    if (pageState == "home") {
      fetchLatestBlogs({ page: 1 });
    } else {
      //2:7
      // fetchBlogByCategory();
      fetchBlogByCategory({ page: 1 });
    }

    if (!trendingBlogs) {
      fetchTrendingBlogs();
    }
  }, [pageState]);

  return (
    <AnimationWrapper>
      <section className="h-cover flex justify-center gap-10">
        {/* Latest Blog */}
        <div className="w-full">
          <InPageNavigation
            routes={[pageState, "trending blogs"]}
            defaultHidden={["trending blogs"]}
          >
            <>
              {blogs == null ? (
                <Loader />
              ) : (
                // blogs.length ? 
                blogs.results && blogs.results.length ? 
                  // <h1>blogs are in state</h1>
                  blogs.results.map((blog, i) => {
                    return (
                      <AnimationWrapper
                        transition={{
                          duration: 1,
                          delay: i * 0.1,
                        }}
                        key={i}
                      >
                        {/* add blog as props in blogPostCard */}
                        <BlogPostCard
                          content={blog}
                          author={blog.author.personal_info}
                        />
                      </AnimationWrapper>
                    );
                  })
                : 
                  <NoDataMessage message="No blogs published" />
                )}
                <LoadMoreDataBtn state={blogs} fetchDataFun={( pageState == "home" ? fetchLatestBlogs : fetchBlogByCategory )}/>
            </>

            {/* <h1>trending blogs here</h1> */}
            {trendingBlogs == null ? (
              <Loader />
            ) : trendingBlogs.length ? (
              // <h1>blogs are in state</h1>
              trendingBlogs.map((blog, i) => {
                return (
                  <AnimationWrapper
                    transition={{ duration: 1, delay: i * 0.1 }}
                    key={i}
                  >
                    {/* add blog as props in blogPostCard */}
                    <MinimalBlogPost blog={blog} index={i} />
                  </AnimationWrapper>
                );
              })
            ) : (
              <NoDataMessage message="No trending blogs" />
            )}
          </InPageNavigation>
        </div>

        {/* Fliters and trending blog */}
        <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
          <div className="flex flex-col gap-10">
            <div>
              <h1 className="font-medium text-xl mb-8">
                Stories from all interests
              </h1>

              <div className="flex gap-3 flex-wrap">
                {categories.map((category, i) => {
                  return (
                    <button
                      onClick={loadBlogByCategory}
                      className={
                        "tag" +
                        (pageState == category ? " bg-black text-white" : " ")
                      }
                      key={i}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h1 className="font-medium text-xl mb-8">
                Trending <i className="fi fi-rr-arrow-trend-up"></i>
              </h1>

              {trendingBlogs == null ? (
                <Loader />
              ) : trendingBlogs.length ? (
                // <h1>blogs are in state</h1>
                trendingBlogs.map((blog, i) => {
                  return (
                    <AnimationWrapper
                      transition={{ duration: 1, delay: i * 0.1 }}
                      key={i}
                    >
                      {/* add blog as props in blogPostCard */}
                      <MinimalBlogPost blog={blog} index={i} />
                    </AnimationWrapper>
                  );
                })
              ) : (
                <NoDataMessage message="No trending blogs" />
              )}
            </div>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default HomePage;
