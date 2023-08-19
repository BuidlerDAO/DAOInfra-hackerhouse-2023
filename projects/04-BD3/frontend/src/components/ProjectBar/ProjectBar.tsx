"use client";

import React, { useState } from 'react';
import {
    InputAdornment,
    TextField,
    IconButton,
    Menu,
    MenuItem,
    Checkbox,
    Button
} from '@mui/material';
import { Search, Favorite, Add, Sort } from '@mui/icons-material';
import { CheckedItems, CheckboxItem } from '@/Types/ProjectBar';
import styles from './index.module.scss'

const ProjectBar: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [checkedItems, setCheckedItems] = useState<CheckedItems>([]);

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleCheckboxChange = (item: CheckboxItem) => {
        setCheckedItems(prev =>
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    const handleConfirm = () => {
        // Send request with checkedItems
        console.log(checkedItems);
        handleCloseMenu();
    };

    const handleClear = () => {
        setCheckedItems([]);
        // Send request with empty array
        console.log([]);
        handleCloseMenu();
    };

    return (
        <div className={`${styles.projectBarContainer} mb-8`} style={{ display: 'flex', alignItems: 'center' }}>
            <TextField
                variant="outlined"
                placeholder="Search"
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                    ),
                }}
            />
            <IconButton>
                <Favorite />
            </IconButton>
            <IconButton onClick={handleOpenMenu}>
                <Add />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
            >
                {(['Item1', 'Item2', 'Item3'] as CheckboxItem[]).map(item => (
                    <MenuItem key={item}>
                        <Checkbox
                            checked={checkedItems.includes(item)}
                            onChange={() => handleCheckboxChange(item)}
                        />
                        {item}
                    </MenuItem>
                ))}
                <Button onClick={handleConfirm}>Confirm</Button>
                <Button onClick={handleClear}>Clear</Button>
            </Menu>
            <IconButton>
                <Sort />
            </IconButton>
        </div>
    );
}

export default ProjectBar;
