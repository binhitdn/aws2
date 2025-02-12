import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";

const withAuth = (WrappedComponent) => {
  return (props) => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          await axios.get("/api/profile");
          setLoading(false);
        } catch (err) {
          router.replace("/login");
        }
      };

      checkAuth();
    }, []);

    if (loading) {
      return <p className="text-center mt-10">Loading...</p>;
    }

    return <WrappedComponent {...props} />;
  };
};

export default withAuth;
