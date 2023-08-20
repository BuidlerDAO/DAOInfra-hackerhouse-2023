# What
RoboHorse dAPP is a totally decentralized application which can help you connect different blockchains or Web2 service. 

In this dAPP, you can create and run scripts on frontend, and every script is combined from some sub-scripts which could be a web2 request with web service or a web3 interaction with node of blockchain.

For some examples, you can:

- read one coin's price from CEX, then write the price to the contract deployed on ethereum or other blockchains.

- monitor the events or transcations from the blockchain, then send a transaction to invoke the contract to execute expected action.

- read data from web2, then check the value of contract on blockchain, if satisfy the condition, send a transaction.

- set a timer, and mint NFTs automatically when the time comes

- compare the prices of coins on CEX or DEX, then arbitrage.

- ...

# How

- At first, an egine which could run script should be developed. When script is loaded in engine, it's sub-scripts will be run by rule. The engin could recognize every type of sub-script and check that the sub-scripts comply with the specification, if pass, it will run them one by one.

- Secondly, on frontend, we could design the script, with no code, just configuration. Sub-script is the most basic functional unit which contains some basic elements, such as blockchain id, contract address, event or function's name, the value of functions's parameters, the dependent conditions, number of repeated executions, and so on.

- At last, when script is configured to complete, it could be run on frontend by engin.

# Why
In Web3, almost all of the developers need to write script to implement some interactions between Web2 & Web3, which is a private and duplicated job I think.
What they write in the script, only can be run by themselves, and the main logic is similiar too. And I think we could simplify these jobs and make the script run by everyone who is even not a developer.