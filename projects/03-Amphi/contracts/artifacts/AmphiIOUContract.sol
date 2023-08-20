// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Amphi{
    struct IOU {
        address creditor; // 债权人
        address debtor; // 债务人
        uint workload; // 工作量
        uint256 number_of_tokens; // 多少代币，以wei计算，币种为以太坊
        string currency; // 币种
        uint timestamp; // 时间戳
        bool still_in_arrears; // 是否仍然欠款
        bool isUsed; // 是否被使用
    }

    // 对每个债权人，可查看单个币种对应的债权集合
    mapping (address => mapping (string => bytes32[])) creditorMap;
    // mapping (address => bool) creditorMapExist;
    // 对每个债务人，也可查看单个币种对应的债务集合
    mapping (address => mapping (string => bytes32[])) debtorMap;
    // mapping (address => bool) debtorMapExist;

    mapping (bytes32 => IOU) set;

    // function hashcode(IOU memory iou) private pure returns (bytes32) {
    //     return keccak256(abi.encodePacked(iou.creditor, iou.debtor, iou.workload, iou.number_of_tokens, iou.currency, iou.timestamp));
    // }

    function do_pay(bytes32 key) public payable {
        // 1. 先判断订单是否存在，并且订单内付款金额是否相同
        require(set[key].debtor == msg.sender && set[key].number_of_tokens == msg.value);
        // 2.进行付款
        payable(msg.sender).transfer(set[key].number_of_tokens);
        // 3.更新状态
        set[key].still_in_arrears = false;
    }

    // 进行交易，返回当前订单索引
    function do_trade_IOU(IOU memory iou) public returns (bytes32) {
        // 1.先判断当前string是否符合合法代币，如果不符合直接返回错误，也需要判断格式是否正确
        iou.debtor = msg.sender;
        iou.isUsed = true;
        iou.still_in_arrears = true;
        // 2.将当前的IOU记录到集合中，并同步address
        // 2.1 计算出当前的pure 的pure 的合法bytes32
       bytes32 key= keccak256(abi.encodePacked(iou.creditor, iou.debtor, iou.workload, iou.number_of_tokens, iou.currency, iou.timestamp));
        // 2.2 将结果放入set，并将地址放入对饮的mapping中
        set[key] = iou;
        creditorMap[iou.creditor][iou.currency].push(key);
        debtorMap[msg.sender][iou.currency].push(key);
        return key;
    }

    function get_IOU_for_creditor_identity(string memory currency) public view returns (IOU[] memory) {
        IOU[] memory result;
        // if (creditorMapExist[msg.sender] == false) {
        //     return result;
        // }
        bytes32[] memory array = creditorMap[msg.sender][currency];
         result = new IOU[](array.length);
        // offset = 20 * offset;
         uint256 i = 0;
         for (; i < array.length;i++) {
            result[i] = set[array[i]];
            i++;
          }
        return result;
    }

    function get_IOU_for_debtor_identity(string memory currency) public view returns (IOU[] memory){
        IOU[] memory result;
        // if (debtorMapExist[msg.sender] == false) {
        //     return result;
        // }
        bytes32[] memory array = debtorMap[msg.sender][currency];
        result = new IOU[](array.length);
        // offset = 20 * offset;
        uint256 i = 0;
        for (; i < array.length;i++) {
            result[i] = set[array[i]];
        }
        return result;
    }
}
