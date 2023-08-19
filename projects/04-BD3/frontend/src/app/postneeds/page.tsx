"use client"

import React from 'react';
import PostNeedsPanel from "@/components/PostNeedsPanel/PostNeedsPanel";

const Page: React.FC = () => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission logic here
    };

    return (
        <div>
            <PostNeedsPanel />
        </div>
    );
}

export default Page;
