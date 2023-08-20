import {
  Button,
  Heading,
  Box,
  HStack,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
} from '@chakra-ui/react';
import React, { FC, useEffect, useState } from 'react';
import { isEmptyObj } from 'utils/utils';
import { ScriptCard } from 'components/modules';

const ScriptList: FC = () => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [scriptList, setScriptList] =useState<any[]>([]);
  const [scriptName, setScriptName] =useState<string>('');
  const [scriptDesc, setScriptDesc] =useState<string>('');

  const lsName = 'scriptList';

  useEffect(() => {
    var scriptsInfo = global.localStorage.getItem(lsName);
    if (isEmptyObj(scriptsInfo)) {
      scriptsInfo = '{}';
    }
    var tmpList = Object.entries(JSON.parse(scriptsInfo as string)).map(entry => entry[1]);
    tmpList = tmpList.sort((a: any, b: any) => b.createdTime - a.createdTime);
    setScriptList(tmpList);
  }, []);


  const addScript = () => {
    const index = scriptList.findIndex((item: any) => item.name === scriptName);
    if (index > -1) {
      toast({
        title: 'Failed',
        description: "Script name is duplicate.",
        status: 'error',
        position: 'bottom-right',
        isClosable: true,
      });
      return;
    }
    scriptList.push({name: scriptName, desc: scriptDesc, createdTime: new Date().getTime()});
    scriptList.sort((a: any, b: any) => b.createdTime - a.createdTime);
    setScriptList(JSON.parse(JSON.stringify(scriptList)));
    global.localStorage.setItem(lsName, JSON.stringify(scriptList));
    onClose();
  }

  return (
      <>
        <Heading size="lg" marginBottom={6}>
          <HStack justifyContent='space-between'>
              <div />
              <Button colorScheme='teal' variant='outline' onClick={onOpen}>Add Script</Button>
          </HStack>
        </Heading>
        {scriptList?.length ? (
          <SimpleGrid  columns={3} spacing={10}>
          {scriptList.map((scriptInfo, key) => (
              <ScriptCard {...scriptInfo} scriptObj={scriptInfo}/>
          ))}
          </SimpleGrid>
      ) : (
          <Box>Oooooops...there is no script belonged to you, LFG!</Box>
      )}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Script</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input onChange={(e) => setScriptName(e.target.value)} value={scriptName}/>
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Description</FormLabel>
              <Input onChange={(e) => setScriptDesc(e.target.value)} value={scriptDesc}/>
            </FormControl>
          </ModalBody>

          <ModalFooter>            
            <Button colorScheme='blue' mr={3} onClick={addScript}>
              Confirm
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      </>
    );
}

export default ScriptList;

